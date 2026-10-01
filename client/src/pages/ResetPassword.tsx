import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Lock, Eye, EyeOff, ArrowLeft, CheckCircle, Loader2, XCircle } from "lucide-react";
import { TalkEasyLogo } from "@/components/TalkEasyLogo";
import { useToast } from "@/hooks/use-toast";

type PageState = "verifying" | "valid" | "invalid" | "success";

export default function ResetPassword() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Read token from query string
  const token = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("token") || "";
  }, []);

  const [pageState, setPageState] = useState<PageState>("verifying");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [isPending, setIsPending] = useState(false);

  // Verify token on mount
  useEffect(() => {
    if (!token) { setPageState("invalid"); return; }
    (async () => {
      try {
        const res = await fetch("/api/auth/verify-reset-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        setPageState(res.ok ? "valid" : "invalid");
      } catch {
        setPageState("invalid");
      }
    })();
  }, [token]);

  const passwordStrength = useMemo(() => {
    if (password.length === 0) return null;
    if (password.length < 8) return { label: "Too short", color: "text-red-500", width: "20%" };
    const has = (r: RegExp) => r.test(password);
    const score =
      (has(/[A-Z]/) ? 1 : 0) +
      (has(/[0-9]/) ? 1 : 0) +
      (has(/[^A-Za-z0-9]/) ? 1 : 0) +
      (password.length >= 12 ? 1 : 0);
    if (score <= 1) return { label: "Weak", color: "text-orange-500", width: "40%" };
    if (score === 2) return { label: "Fair", color: "text-yellow-500", width: "60%" };
    if (score === 3) return { label: "Good", color: "text-teal-500", width: "80%" };
    return { label: "Strong", color: "text-green-500", width: "100%" };
  }, [password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({ title: "Passwords do not match", variant: "destructive" });
      return;
    }
    if (password.length < 8) {
      toast({ title: "Password must be at least 8 characters", variant: "destructive" });
      return;
    }
    setIsPending(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });
      if (res.ok) {
        setPageState("success");
      } else {
        const data = await res.json().catch(() => ({}));
        toast({ title: data.message || "Failed to reset password", variant: "destructive" });
      }
    } catch {
      toast({ title: "Something went wrong. Please try again.", variant: "destructive" });
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-teal-50/30 to-slate-100 dark:from-slate-950 dark:via-teal-950/10 dark:to-slate-900 p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Link href="/" className="cursor-pointer">
            <TalkEasyLogo size={40} />
          </Link>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl shadow-slate-200/60 dark:shadow-slate-950/60 p-8 border border-slate-100 dark:border-slate-800">
          {pageState === "verifying" && (
            <div className="text-center py-8 space-y-3">
              <Loader2 className="w-10 h-10 animate-spin text-teal-600 mx-auto" />
              <p className="text-muted-foreground">Verifying your reset link…</p>
            </div>
          )}

          {pageState === "invalid" && (
            <div className="text-center space-y-4 py-4">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-2xl flex items-center justify-center mx-auto">
                <XCircle className="w-8 h-8 text-red-500" />
              </div>
              <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white">
                Invalid or Expired Link
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                This password reset link is invalid or has expired. Reset links are valid for 1 hour and can only be used once.
              </p>
              <Link
                href="/forgot-password"
                className="inline-flex items-center gap-2 text-sm font-semibold text-teal-600 dark:text-teal-400 hover:text-teal-700 bg-teal-50 dark:bg-teal-900/20 px-4 py-2.5 rounded-xl transition-colors"
              >
                Request a new reset link
              </Link>
            </div>
          )}

          {pageState === "valid" && (
            <>
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-teal-100 dark:bg-teal-900/30 rounded-xl flex items-center justify-center">
                    <Lock className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                  </div>
                  <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white">
                    Set New Password
                  </h1>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                  Create a new strong password for your TalkEasy account.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* New Password */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type={showPw ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      required
                      autoComplete="new-password"
                      className="w-full pl-10 pr-12 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 outline-none transition-all text-slate-900 dark:text-slate-100 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((v) => !v)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {/* Strength indicator */}
                  {passwordStrength && (
                    <div className="mt-2">
                      <div className="h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-current rounded-full transition-all"
                          style={{ width: passwordStrength.width }}
                        />
                      </div>
                      <p className={`text-xs mt-1 font-medium ${passwordStrength.color}`}>
                        {passwordStrength.label}
                      </p>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type={showPw ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat your new password"
                      required
                      autoComplete="new-password"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 outline-none transition-all text-slate-900 dark:text-slate-100 text-sm"
                    />
                  </div>
                  {confirmPassword && confirmPassword !== password && (
                    <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isPending || !password || !confirmPassword || password !== confirmPassword}
                  className="w-full py-3.5 rounded-xl bg-teal-600 text-white font-bold hover:bg-teal-700 disabled:opacity-50 transition-all shadow-lg shadow-teal-600/20 flex justify-center items-center gap-2"
                >
                  {isPending ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Updating…</>
                  ) : (
                    "Update Password"
                  )}
                </button>
              </form>
            </>
          )}

          {pageState === "success" && (
            <div className="text-center space-y-4 py-4">
              <div className="w-16 h-16 bg-teal-100 dark:bg-teal-900/30 rounded-2xl flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-teal-600 dark:text-teal-400" />
              </div>
              <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white">
                Password Updated!
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                Your password has been reset successfully. You can now sign in with your new password.
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 px-6 py-3 rounded-xl transition-colors shadow-lg shadow-teal-600/20"
              >
                Sign In
              </Link>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          TalkEasy v6.0 · Wellness Platform
        </p>
      </div>
    </div>
  );
}

// useMemo needs to be imported
import { useMemo } from "react";
