import { MessageCircle } from "lucide-react";
import { useTranslation } from "@/i18n/LanguageContext";

export default function Chatbot() {
  const { t } = useTranslation();

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-10">
      <div className="glass-card w-full max-w-3xl rounded-3xl p-8 md:p-12 border-2 border-slate-200 dark:border-slate-800 shadow-xl text-center space-y-6">
        <div className="mx-auto w-20 h-20 rounded-3xl bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
          <MessageCircle className="w-10 h-10 text-teal-600 dark:text-teal-400" />
        </div>

        <div className="space-y-3">
          <div className="inline-flex items-center rounded-full bg-amber-100 dark:bg-amber-900/30 px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
            Coming Soon
          </div>
          <h1 className="text-3xl md:text-4xl font-display font-extrabold text-slate-900 dark:text-white">
            {t("chatTitle")} — Coming Soon
          </h1>
          <p className="text-lg text-slate-700 dark:text-slate-200 leading-relaxed font-medium max-w-2xl mx-auto">
            This feature is currently under development. We're working on making TalkEasy safe,
            reliable and meaningful before its official release.
          </p>
          <p className="text-base text-muted-foreground leading-relaxed max-w-xl mx-auto">
            Support Chat will be available very soon in the next TalkEasy version.
          </p>
        </div>

        <div className="pt-2 text-sm text-muted-foreground">
          {t("disclaimerText")}
        </div>
      </div>
    </div>
  );
}
