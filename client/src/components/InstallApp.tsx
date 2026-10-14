import { useState } from "react";
import { Download, Smartphone, Share, MoreVertical, X, CheckCircle2 } from "lucide-react";
import { useInstallPrompt, type InstallPlatform } from "@/hooks/use-install-prompt";

function manualSteps(platform: InstallPlatform): { icon: React.ReactNode; text: string }[] {
  if (platform === "ios") {
    return [
      { icon: <Share className="w-4 h-4 text-teal-600" />, text: "Open TalkEasy in Safari." },
      { icon: <Share className="w-4 h-4 text-teal-600" />, text: "Tap the Share button (the square with an arrow)." },
      { icon: <CheckCircle2 className="w-4 h-4 text-teal-600" />, text: "Choose “Add to Home Screen”, then tap Add." },
    ];
  }
  if (platform === "android") {
    return [
      { icon: <MoreVertical className="w-4 h-4 text-teal-600" />, text: "In Chrome, tap the ⋮ menu (top-right)." },
      { icon: <Download className="w-4 h-4 text-teal-600" />, text: "Tap “Install app” (or “Add to Home screen”)." },
      { icon: <CheckCircle2 className="w-4 h-4 text-teal-600" />, text: "Confirm — TalkEasy opens in its own window." },
    ];
  }
  return [
    { icon: <Download className="w-4 h-4 text-teal-600" />, text: "In Chrome or Edge, look for the install icon in the address bar." },
    { icon: <MoreVertical className="w-4 h-4 text-teal-600" />, text: "Or open the browser menu (⋮) and choose “Install TalkEasy”." },
    { icon: <CheckCircle2 className="w-4 h-4 text-teal-600" />, text: "Confirm — TalkEasy launches as its own app." },
  ];
}

interface InstallAppProps {
  variant?: "card" | "banner";
}

/**
 * Android Chrome install surface. When the browser offers a native prompt we
 * show a working button; otherwise we show the exact menu steps. Nothing is
 * shown once the app is already running installed.
 */
export function InstallApp({ variant = "card" }: InstallAppProps) {
  const { canInstall, installed, promptInstall, platform } = useInstallPrompt();
  const [dismissed, setDismissed] = useState(false);
  const [busy, setBusy] = useState(false);

  if (installed || dismissed) return null;

  const steps = manualSteps(platform);

  const handleInstall = async () => {
    setBusy(true);
    await promptInstall();
    setBusy(false);
  };

  if (variant === "banner") {
    return (
      <div className="relative rounded-2xl border border-teal-200 dark:border-teal-900/50 bg-gradient-to-r from-teal-50 to-sky-50 dark:from-teal-950/40 dark:to-sky-950/40 p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center text-white flex-shrink-0">
          <Smartphone className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Install TalkEasy</p>
          <p className="text-xs text-muted-foreground">
            {canInstall
              ? "Add it to your home screen for an app-like experience and background reminders."
              : platform === "ios"
                ? "Tap Share → Add to Home Screen to install."
                : "Open the browser menu and choose “Install app”."}
          </p>
        </div>
        {canInstall && (
          <button
            type="button"
            onClick={handleInstall}
            disabled={busy}
            className="px-3 py-2 rounded-lg bg-teal-600 text-white text-xs font-bold hover:bg-teal-700 disabled:opacity-50 flex items-center gap-1.5 whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" /> Install
          </button>
        )}
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <section className="glass-card rounded-3xl p-8 space-y-4">
      <h2 className="font-bold text-base text-slate-700 dark:text-slate-300 flex items-center gap-2">
        <Smartphone className="w-4 h-4 text-teal-600" /> Install TalkEasy on your phone
      </h2>
      <p className="text-sm text-muted-foreground">
        Install the app for a standalone, full-screen experience with its own icon — and to receive
        mood check-in reminders in the background.
      </p>

      {canInstall ? (
        <button
          type="button"
          onClick={handleInstall}
          disabled={busy}
          className="px-5 py-2.5 rounded-xl bg-teal-600 text-white font-bold hover:bg-teal-700 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          <Download className="w-4 h-4" /> Install app
        </button>
      ) : (
        <ol className="space-y-2">
          {steps.map((step, index) => (
            <li key={index} className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-300">
              <span className="mt-0.5">{step.icon}</span>
              <span>{step.text}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
