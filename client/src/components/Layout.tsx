import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { useUser } from "@/hooks/use-user";
import { Loader2 } from "lucide-react";
import { useTranslation } from "@/i18n/LanguageContext";

export function Layout({ children }: { children: ReactNode }) {
  const { isLoading, data: user } = useUser();
  const { isRTL } = useTranslation();

  // Age-adaptive UX
  const getAgeGroupSettings = () => {
    const ageGroup = user?.ageGroup || '';
    if (ageGroup.includes('Teen')) {
      return {
        fontSize: 'text-base',
        spacing: 'space-y-6',
        cardPadding: 'p-5',
        buttonSize: 'text-sm px-4 py-2',
      };
    } else if (ageGroup.includes('Young Adult')) {
      return {
        fontSize: 'text-base',
        spacing: 'space-y-6',
        cardPadding: 'p-5',
        buttonSize: 'text-sm px-4 py-2',
      };
    } else if (ageGroup.includes('Senior')) {
      return {
        fontSize: 'text-lg',
        spacing: 'space-y-8',
        cardPadding: 'p-6',
        buttonSize: 'text-base px-6 py-3',
      };
    }
    // Default for adults
    return {
      fontSize: 'text-base',
      spacing: 'space-y-6',
      cardPadding: 'p-5',
      buttonSize: 'text-sm px-4 py-2',
    };
  };

  const ageSettings = getAgeGroupSettings();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-background text-foreground flex ${isRTL ? 'rtl' : 'ltr'}`}>
      <Sidebar />
      <main className={`flex-1 ${isRTL ? 'mr-64 ml-0' : 'ml-64 mr-0'} p-8 overflow-y-auto h-screen ${ageSettings.fontSize}`}>
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
