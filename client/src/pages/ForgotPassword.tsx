import { useState } from "react";
import { Link } from "wouter";
import { Mail, ArrowLeft, CheckCircle, Loader2, ShieldCheck } from "lucide-react";
import { TalkEasyLogo } from "@/components/TalkEasyLogo";
import { useToast } from "@/hooks/use-toast";

export default function ForgotPassword() {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsPending(true);
    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      // Always show the same success message regardless of whether the email exists
      setSubmitted(true);
    } catch {
      toast({
        title: "Something went wrong",
        description: "Please try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-teal-50/30 to-slate-100 dark:from-slate-950 dark:via-teal-950/10 dark:to-slate-900 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link href="/" className="cursor-pointer">
            <TalkEasyLogo size={40} />
          </Link>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl shadow-slate-200/60 dark:shadow-slate-950/60 p-8 border border-slate-100 dark:border-slate-800">
          {submitted ? (
            /* ── Success State ── */
            <div className="text-center space-y-4 py-4">
              <div className="w-16 h-16 bg-teal-100 dark:bg-teal-900/30 rounded-2xl flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-teal-600 dark:text-teal-400" />
              </div>
              <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white">
                Check your email
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                If an account exists for <strong className="text-slate-700 dark:text-slate-300">{email}</strong>, 
                a password reset link has been sent. It will expire in 1 hour.
              </p>
              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-xl p-3 text-xs text-amber-700 dark:text-amber-400 text-left">
                <strong>Didn't receive an email?</strong> Check your spam folder. 
                If you still don't see it, wait a few minutes and try again.
              </div>
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-sm text-teal-600 dark:text-teal-400 hover:text-teal-700 font-medium mt-2"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Sign In
              </Link>
            </div>
          ) : (
            /* ── Request Form ── */
            <>
              <div className="mb-8">
                <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
                  <ArrowLeft className="w-4 h-4" /> Back to Sign In
                </Link>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-teal-100 dark:bg-teal-900/30 rounded-xl flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                  </div>
                  <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white">
                    Reset Password
                  </h1>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                  Enter your account email and we'll send you a secure reset link.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      autoComplete="email"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 outline-none transition-all text-slate-900 dark:text-slate-100 text-sm"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isPending || !email.trim()}
                  className="w-full py-3.5 rounded-xl bg-teal-600 text-white font-bold hover:bg-teal-700 disabled:opacity-50 transition-all shadow-lg shadow-teal-600/20 flex justify-center items-center gap-2"
                >
                  {isPending ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</>
                  ) : (
                    "Send Reset Link"
                  )}
                </button>
              </form>

              <p className="text-xs text-center text-muted-foreground mt-6">
                For security, reset links expire after 1 hour and can only be used once.
              </p>
            </>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          TalkEasy v6.0 · Wellness Platform
        </p>
      </div>
    </div>
  );
}
