import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Mail, Lock, User as UserIcon, Leaf } from "lucide-react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import logo from "@/assets/logo.jpeg";
import panelImage from "@/assets/hero-cereals.jpg";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Connexion — Cereals House" }] }),
  validateSearch: (s: Record<string, unknown>) => ({
    redirect: typeof s.redirect === "string" ? s.redirect : "/",
  }),
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
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("auth.errorGeneric"));
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
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("auth.errorGoogle"));
    }
  }

  const points = [t("auth.panelPoint1"), t("auth.panelPoint2"), t("auth.panelPoint3")];

  const inputClass =
    "peer w-full rounded-xl border border-input bg-background py-2.5 pl-10 pr-3 text-sm transition-colors duration-200 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20";
  const iconClass =
    "pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors duration-200 peer-focus:text-gold";

  return (
    <div className="grid min-h-[calc(100dvh-80px)] lg:grid-cols-2">
      {/* Panneau de marque — visible uniquement à partir de lg, purement illustratif */}
      <div className="relative hidden overflow-hidden bg-primary lg:block">
        <img
          src={panelImage}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-40 motion-safe:animate-[fade-in_1.2s_ease-out_both]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/85 to-primary/60" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,transparent_30%,rgba(0,0,0,0.35)_100%)]" />

        <div className="relative flex h-full flex-col justify-between p-12 text-primary-foreground xl:p-16">
          <Link
            to="/"
            className="group inline-flex items-center gap-3 motion-safe:animate-[fade-in_0.7s_ease-out_both]"
          >
            <img
              src={logo}
              alt="Cereals House"
              className="h-11 w-11 rounded-full object-cover ring-2 ring-gold/50 transition-transform duration-500 group-hover:rotate-6"
            />
            <span className="font-display text-lg font-bold">Cereals House</span>
          </Link>

          <div>
            <span
              className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-background/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-gold backdrop-blur motion-safe:animate-[fade-in_0.7s_ease-out_both]"
              style={{ animationDelay: "100ms" }}
            >
              <Leaf className="h-3.5 w-3.5" /> {t("auth.panelEyebrow")}
            </span>
            <h2
              className="mt-5 max-w-md font-display text-4xl font-bold leading-tight motion-safe:animate-[fade-in_0.8s_ease-out_both] xl:text-[2.75rem]"
              style={{ animationDelay: "180ms" }}
            >
              {t("auth.panelTitle")}
            </h2>

            <ul className="mt-8 space-y-3">
              {points.map((p, idx) => (
                <li
                  key={p}
                  style={{ animationDelay: `${260 + idx * 90}ms` }}
                  className="flex items-center gap-3 text-sm text-primary-foreground/85 motion-safe:animate-[fade-in_0.6s_ease-out_both]"
                >
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                  {p}
                </li>
              ))}
            </ul>
          </div>

          <blockquote
            className="max-w-sm border-l-2 border-gold/50 pl-4 text-sm italic text-primary-foreground/75 motion-safe:animate-[fade-in_0.8s_ease-out_both]"
            style={{ animationDelay: "540ms" }}
          >
            {t("auth.panelQuote")}
            <footer className="mt-2 text-xs font-semibold not-italic uppercase tracking-widest text-gold">
              {t("auth.panelQuoteAuthor")}
            </footer>
          </blockquote>
        </div>
      </div>

      {/* Formulaire */}
      <div className="flex flex-col justify-center px-4 py-12 sm:px-6 lg:px-12 xl:px-20">
        <div className="mx-auto w-full max-w-sm">
          <div className="text-center motion-safe:animate-[fade-in_0.5s_ease-out_both] lg:hidden">
            <img
              src={logo}
              alt=""
              className="mx-auto h-14 w-14 rounded-full object-cover ring-2 ring-gold/40"
            />
          </div>

          {/* Bascule connexion / inscription, en pilule animée */}
          <div
            className="mx-auto mt-6 flex w-full max-w-[280px] rounded-full border border-border bg-secondary/60 p-1 motion-safe:animate-[fade-in_0.5s_ease-out_both] lg:mt-0"
            role="tablist"
          >
            {(["signin", "signup"] as const).map((m) => (
              <button
                key={m}
                type="button"
                role="tab"
                aria-selected={mode === m}
                onClick={() => setMode(m)}
                className={`flex-1 rounded-full py-2 text-sm font-semibold transition-all duration-300 ${
                  mode === m
                    ? "bg-gold text-gold-foreground shadow-gold"
                    : "text-muted-foreground hover:text-primary"
                }`}
              >
                {m === "signin" ? t("auth.tabSignIn") : t("auth.tabSignUp")}
              </button>
            ))}
          </div>

          <div
            key={mode}
            className="mt-7 text-center motion-safe:animate-[fade-in_0.4s_ease-out_both]"
          >
            <h1 className="font-display text-3xl font-bold text-primary">
              {mode === "signin" ? t("auth.signInTitle") : t("auth.signUpTitle")}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {mode === "signin" ? t("auth.signInSubtitle") : t("auth.signUpSubtitle")}
            </p>
          </div>

          <div
            className="mt-7 motion-safe:animate-[fade-in_0.5s_ease-out_both]"
            style={{ animationDelay: "60ms" }}
          >
            <button
              type="button"
              onClick={handleGoogle}
              className="flex w-full items-center justify-center gap-2 rounded-full border border-border bg-background py-3 text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:border-gold hover:bg-secondary hover:shadow-soft"
            >
              <GoogleIcon /> {t("auth.google")}
            </button>

            <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
              <div className="h-px flex-1 bg-border" /> {t("auth.or")}{" "}
              <div className="h-px flex-1 bg-border" />
            </div>

            <form onSubmit={handleEmail} className="space-y-3">
              {mode === "signup" && (
                <div className="relative motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-2 motion-safe:duration-300">
                  <UserIcon className={iconClass} />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    placeholder={t("auth.fullName")}
                    className={inputClass}
                  />
                </div>
              )}
              <div className="relative">
                <Mail className={iconClass} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder={t("auth.email")}
                  className={inputClass}
                />
              </div>
              <div className="relative">
                <Lock className={iconClass} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder={t("auth.password")}
                  className={inputClass}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-gold py-3 text-sm font-semibold text-gold-foreground shadow-gold transition-all duration-300 hover:-translate-y-0.5 hover:bg-gold/90 hover:shadow-[0_20px_50px_-15px_rgba(212,175,55,0.6)] disabled:translate-y-0 disabled:opacity-60"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {mode === "signin" ? t("auth.signInBtn") : t("auth.signUpBtn")}
              </button>
            </form>

            <p className="mt-5 text-center text-sm text-muted-foreground">
              {mode === "signin" ? t("auth.noAccount") : t("auth.haveAccount")}{" "}
              <button
                type="button"
                onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
                className="font-semibold text-gold hover:underline"
              >
                {mode === "signin" ? t("auth.goSignUp") : t("auth.goSignIn")}
              </button>
            </p>
          </div>

          <Link
            to="/"
            className="mt-6 block text-center text-sm text-muted-foreground transition-colors duration-200 hover:text-gold"
          >
            {t("auth.back")}
          </Link>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.3 35.5 24 35.5 17.6 35.5 12.5 30.4 12.5 24S17.6 12.5 24 12.5c2.9 0 5.6 1.1 7.6 2.9l5.7-5.7C33.9 6.4 29.2 4.5 24 4.5 13.2 4.5 4.5 13.2 4.5 24S13.2 43.5 24 43.5c10.7 0 19.5-7.7 19.5-19.5 0-1.3-.1-2.3-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 16 19 12.5 24 12.5c2.9 0 5.6 1.1 7.6 2.9l5.7-5.7C33.9 6.4 29.2 4.5 24 4.5 16.3 4.5 9.7 8.8 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 43.5c5.1 0 9.7-1.9 13.2-5.1l-6.1-5c-1.9 1.3-4.3 2.1-7.1 2.1-5.3 0-9.7-3.1-11.3-7.4l-6.5 5C9.5 39.1 16.2 43.5 24 43.5z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.4l6.1 5c4.3-4 7.2-9.9 7.2-16.4 0-1.3-.1-2.3-.4-3.5z"
      />
    </svg>
  );
}
