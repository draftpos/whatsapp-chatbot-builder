import { Bell, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUnreadCount } from "@/contexts/UnreadCountContext";
import { useLocation } from "wouter";

interface HeaderProps {
  title: string;
  subtitle?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export default function Header({ title, subtitle, action }: HeaderProps) {
  const unreadCount = useUnreadCount();
  const [,setLocation] = useLocation();
  return (
    <header className="bg-white shadow-sm border-b border-gray-100 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {subtitle && (
            <p className="text-sm text-gray-600">{subtitle}</p>
          )}
        </div>
        <div className="flex items-center space-x-4">
          {action && (
            <Button 
              onClick={action.onClick}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              {action.label}
            </Button>
          )}
          
          {/* Notifications */}
          <div className="relative">
            <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors" onClick={()=> setLocation('/inbox')}>
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
               {unreadCount}
              </span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
