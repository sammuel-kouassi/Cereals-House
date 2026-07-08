import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import logo from "@/assets/logo.jpeg";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Connexion — Cereals House" }] }),
  validateSearch: (s: Record<string, unknown>) => ({ redirect: typeof s.redirect === "string" ? s.redirect : "/" }),
  component: AuthPage,
});

function AuthPage() {
  const router = useRouter();
  const { redirect } = Route.useSearch();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) router.navigate({ to: redirect || "/" });
  }, [user, redirect, router]);

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin, data: { full_name: fullName } },
        });
        if (error) throw error;
        toast.success(t("auth.createdToast"));
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success(t("auth.signedInToast"));
      }
    } catch (err: any) {
      toast.error(err?.message ?? t("auth.errorGeneric"));
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.origin },
      });
      if (error) throw error;
    } catch (err: any) {
      toast.error(err?.message ?? t("auth.errorGoogle"));
    }
  }

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-200px)] max-w-md flex-col justify-center px-4 py-12 sm:px-6">
      <div className="text-center">
        <img src={logo} alt="" className="mx-auto h-16 w-16 rounded-full ring-2 ring-gold/40" />
        <h1 className="mt-4 font-display text-3xl font-bold text-primary">
          {mode === "signin" ? t("auth.signInTitle") : t("auth.signUpTitle")}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {mode === "signin" ? t("auth.signInSubtitle") : t("auth.signUpSubtitle")}
        </p>
      </div>

      <div className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-soft">
        <button type="button" onClick={handleGoogle} className="flex w-full items-center justify-center gap-2 rounded-full border border-border bg-background py-3 text-sm font-semibold transition hover:border-gold hover:bg-secondary">
          <GoogleIcon /> {t("auth.google")}
        </button>

        <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
          <div className="h-px flex-1 bg-border" /> {t("auth.or")} <div className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={handleEmail} className="space-y-3">
          {mode === "signup" && (
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("auth.fullName")}</span>
              <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2.5 focus:border-gold focus:outline-none" />
            </label>
          )}
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("auth.email")}</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2.5 focus:border-gold focus:outline-none" />
          </label>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("auth.password")}</span>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2.5 focus:border-gold focus:outline-none" />
          </label>
          <button type="submit" disabled={loading} className="mt-2 w-full rounded-full bg-gold py-3 text-sm font-semibold text-gold-foreground shadow-gold hover:bg-gold/90 disabled:opacity-50">
            {loading ? "…" : mode === "signin" ? t("auth.signInBtn") : t("auth.signUpBtn")}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-muted-foreground">
          {mode === "signin" ? t("auth.noAccount") : t("auth.haveAccount")}{" "}
          <button type="button" onClick={() => setMode(mode === "signin" ? "signup" : "signin")} className="font-semibold text-gold hover:underline">
            {mode === "signin" ? t("auth.goSignUp") : t("auth.goSignIn")}
          </button>
        </p>
      </div>

      <Link to="/" className="mt-6 text-center text-sm text-muted-foreground hover:text-gold">
        {t("auth.back")}
      </Link>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.3 35.5 24 35.5 17.6 35.5 12.5 30.4 12.5 24S17.6 12.5 24 12.5c2.9 0 5.6 1.1 7.6 2.9l5.7-5.7C33.9 6.4 29.2 4.5 24 4.5 13.2 4.5 4.5 13.2 4.5 24S13.2 43.5 24 43.5c10.7 0 19.5-7.7 19.5-19.5 0-1.3-.1-2.3-.4-3.5z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 12.5 24 12.5c2.9 0 5.6 1.1 7.6 2.9l5.7-5.7C33.9 6.4 29.2 4.5 24 4.5 16.3 4.5 9.7 8.8 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 43.5c5.1 0 9.7-1.9 13.2-5.1l-6.1-5c-1.9 1.3-4.3 2.1-7.1 2.1-5.3 0-9.7-3.1-11.3-7.4l-6.5 5C9.5 39.1 16.2 43.5 24 43.5z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.4l6.1 5c4.3-4 7.2-9.9 7.2-16.4 0-1.3-.1-2.3-.4-3.5z"/>
    </svg>
  );
}