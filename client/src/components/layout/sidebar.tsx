import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Users,
  Megaphone,
  FileText,
  MessageSquare,
  Bot,
  BarChart3,
  Settings,
  Zap,
  ScrollText,
  UsersRound,
  LogOut,
  Menu,
  X,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ChannelSwitcher } from "@/components/channel-switcher";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";
import { useTranslation } from "@/lib/i18n";
import { LanguageSelector } from "@/components/language-selector";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUnreadCount } from "@/contexts/UnreadCountContext";

interface NavItem {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  labelKey: string;
  badge?: string | number;
  color?: string;
  alwaysVisible?: boolean;
  requiredPrefix?: string;
}
// Types
interface BrandSettings {
  title?: string;
  tagline?: string;
  logo?: string;
  favicon?: string;
  updatedAt?: string;
}

const navItems: NavItem[] = [
  {
    href: "/",
    icon: LayoutDashboard,
    labelKey: "navigation.dashboard",
    color: "text-green-600",
    alwaysVisible: true, // always show
  },
  {
    href: "/contacts",
    icon: Users,
    labelKey: "navigation.contacts",
    color: "text-blue-600",
    requiredPrefix: "contacts.",
  },
  {
    href: "/campaigns",
    icon: Megaphone,
    labelKey: "navigation.campaigns",
    color: "text-orange-600",
    requiredPrefix: "campaigns.",
  },
  {
    href: "/templates",
    icon: FileText,
    labelKey: "navigation.templates",
    color: "text-purple-600",
    requiredPrefix: "templates.",
  },
  {
    href: "/inbox",
    icon: MessageSquare,
    labelKey: "navigation.inbox",
    color: "text-red-600",
    requiredPrefix: "inbox.",
  },
  {
    href: "/automation",
    icon: Zap,
    labelKey: "navigation.automations",
    color: "text-indigo-600",
    requiredPrefix: "automations.",
  },
  {
    href: "/analytics",
    icon: BarChart3,
    labelKey: "navigation.analytics",
    color: "text-pink-600",
    requiredPrefix: "analytics.",
  },
  {
    href: "/logs",
    icon: ScrollText,
    labelKey: "navigation.messageLogs",
    color: "text-yellow-600",
    alwaysVisible: true,
  },
  {
    href: "/team",
    icon: UsersRound,
    labelKey: "navigation.team",
    color: "text-teal-600",
    requiredPrefix: "team.",
  },
  {
    href: "/settings",
    icon: Settings,
    labelKey: "navigation.settings",
    color: "text-gray-600",
    alwaysVisible: true,
  },
];

export default function Sidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  // const unreadCount = useUnreadCount();

  const [isAIActive, setIsAIActive] = useState<boolean>(true);

  function canView(item: NavItem) {
    if (item.alwaysVisible) return true;
    if (!item.requiredPrefix) return true;
    if (!user?.permissions) return false;
    // console.log(`Checking permissions for item: ${item.labelKey} (${item.href}) with prefix ${item.requiredPrefix} and user permissions: ${JSON.stringify(user.permissions)}`);
    const perms = Array.isArray(user.permissions)
      ? user.permissions
      : Object.keys(user.permissions);


    if (!item.requiredPrefix) return true;

    const normalize = (str: string) => str.replace(".", ":");
    
    return perms.some(
      (perm) =>
        perm.startsWith(normalize(item.requiredPrefix!)) && // safe because of guard
        (Array.isArray(user.permissions) ? true : user.permissions[perm])
    );
  }

  const handleToggleAI = (): void => {
    setIsAIActive(!isAIActive);
  };

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["/api/conversations/unread-count"],
    queryFn: async () => {
      const response = await fetch("/api/conversations/unread-count", {
        credentials: "include",
      });
      if (!response.ok) return 0;
      const data = await response.json();
      return data.count || 0;
    },
    refetchInterval: 30000, // Refresh every 30 seconds instead of 5
    staleTime: 20000, // Consider data fresh for 20 seconds
  });


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

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md hover:bg-gray-50"
        data-testid="button-open-sidebar"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg border-r border-gray-100 transform transition-transform duration-300",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              { error ?
              <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-white"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.891 3.426" />
                </svg>
              </div>
                : <img src={brandSettings?.logo || '/logo192.png'} alt="Logo" className="w-5 h-5 object-contain" />}
              <div>
                <h1 className="text-xl font-bold text-gray-900"> { error ?'WhatsWay' : brandSettings?.title}</h1>
                <p className="text-xs text-gray-500">{ error ?'Business Platform' : brandSettings?.tagline}</p>
              </div>
            </div>
            <button
              onClick={() => setIsMobileOpen(false)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
              data-testid="button-close-sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Channel Switcher */}
          <div className="px-6 py-3 border-b border-gray-100">
            {/* {user?.role === 'admin' &&   } */}
            <ChannelSwitcher />
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
            {navItems.filter(canView).map((item) => {
              // console.log(`Rendering nav item: ${item.labelKey} (${item.href})`);
              const isActive = location === item.href;
              const Icon = item.icon;
              const showBadge = item.href === "/inbox" && unreadCount > 0;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 hover-lift group",
                    isActive
                      ? "bg-green-50 text-green-700 border-l-4 border-green-600"
                      : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                  )}
                  onClick={() => setIsMobileOpen(false)}
                  data-testid={`link-nav-${
                    item.href.replace("/", "") || "dashboard"
                  }`}
                >
                  <Icon
                    className={cn(
                      "w-5 h-5 mr-3 transition-colors",
                      isActive ? "text-green-600" : item.color
                    )}
                  />
                  {t(item.labelKey)}
                  {item.badge && (
                    <span className="ml-auto bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                      {item.badge}
                    </span>
                  )}
                  {showBadge && (
                    <span className="ml-auto bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Language Selector */}
          <div className="px-6 py-3 border-t border-gray-100">
            <LanguageSelector />
          </div>

          {/* AI Bot Status */}
          {/* <div className="p-4 border-t border-gray-100">
            <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {t("common.aiAssistant")}
                </p>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full pulse-gentle"></div>
                  <span className="text-xs text-gray-600">
                    {t("common.active")}
                  </span>
                </div>
              </div>
            </div>
          </div> */}

          <div className="p-4 border-t border-gray-100">
            <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {t("common.aiAssistant")}
                </p>
                <div className="flex items-center space-x-2">
                  <div
                    className={`w-2 h-2 rounded-full transition-colors ${
                      isAIActive ? "bg-green-500 pulse-gentle" : "bg-gray-400"
                    }`}
                  ></div>
                  <span className="text-xs text-gray-600">
                    {/* {isAIActive ? t("common.active") : t("Inactive")} */}
                    {t('campaigns.comingSoon')}
                  </span>
                </div>
              </div>
              {/* Smaller Toggle Button with Green Color */}
              <button
                onClick={handleToggleAI}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
                  isAIActive ? "bg-green-600" : "bg-gray-200"
                }`}
              >
                <span
                  className={`inline-block h-3 w-3 transform rounded-full bg-white transition ${
                    isAIActive ? "translate-x-5" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* User Profile */}
          <div className="p-4 border-t border-gray-100">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-full flex items-center space-x-3 hover:bg-gray-50 rounded-lg p-2 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-600 to-green-500 flex items-center justify-center">
                    <span className="text-sm font-medium text-white">
                      {user
                        ? (
                            user.firstName?.[0] || user.username[0]
                          ).toUpperCase()
                        : "U"}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {user
                        ? user.firstName && user.lastName
                          ? `${user.firstName} ${user.lastName}`
                          : user.username
                        : "User"}
                    </p>
                    <p className="text-xs text-gray-500 truncate capitalize">
                      {user?.role || "User"}
                    </p>
                  </div>
                  <Settings className="w-4 h-4 text-gray-400" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>{t("common.myAccount")}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>{t("navigation.settings")}</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/account" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>{t("navigation.account")}</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={logout}
                  className="cursor-pointer text-red-600"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>{t("common.logout")}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </>
  );
}
