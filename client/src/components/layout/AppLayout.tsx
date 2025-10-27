import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { setMeta } from "@/hooks/setMeta";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { data: brandSettings } = useQuery({
    queryKey: ["/api/brand-settings"],
    queryFn: () => fetch("/api/brand-settings").then(res => res.json()),
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (brandSettings) {
      setMeta({
        title: brandSettings.title,
        favicon: brandSettings.favicon,
        description: brandSettings.tagline,
        keywords: `${brandSettings.title} ${brandSettings.tagline}`,
      });
    }
  }, [brandSettings]);

  return <>{children}</>;
}
