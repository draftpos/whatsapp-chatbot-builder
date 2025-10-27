import { useTranslation } from "@/lib/i18n";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Globe } from "lucide-react";

export function LanguageSelector() {
  const { language, setLanguage, languages } = useTranslation();

  return (
    <Select value={language} onValueChange={(value: any) => setLanguage(value)}>
      <SelectTrigger className="w-[180px]" data-testid="select-language">
        <Globe className="h-4 w-4 mr-2" />
        <SelectValue placeholder="Select language" />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(languages).map(([code, config]) => (
          <SelectItem key={code} value={code} data-testid={`option-language-${code}`}>
            {config.nativeName}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}