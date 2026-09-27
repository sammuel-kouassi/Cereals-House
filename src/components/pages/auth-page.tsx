import { Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Loader2,
  Mail,
  Lock,
  User as UserIcon,
  Phone,
  Eye,
  EyeOff,
  Sparkles,
  ShieldCheck,
  Star,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Truck,
  HeartHandshake,
  X,
  BadgeCheck,
  Wheat,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/logo.jpeg";
import heroPhoto from "@/assets/hero_cereales_mixtes_pack.jpg";
import { useLanguageNavigation } from "@/lib/i18n-routing";

function GoogleIcon() {
  return (
    <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

function getPasswordStrength(pass: string): { score: number; label: string; color: string } {
  if (!pass) return { score: 0, label: "", color: "" };
  let score = 0;
  if (pass.length >= 6) score++;
  if (pass.length >= 8) score++;
  if (/[0-9]/.test(pass)) score++;
  if (/[^A-Za-z0-9]/.test(pass) || /[A-Z]/.test(pass)) score++;

  if (score <= 1) return { score: 1, label: "Trop court", color: "bg-red-500" };
  if (score === 2) return { score: 2, label: "Moyen", color: "bg-amber-500" };
  if (score === 3) return { score: 3, label: "Bon", color: "bg-emerald-500" };
  return { score: 4, label: "Très robuste", color: "bg-emerald-600" };
}

export function AuthPage({ redirectUrl }: { redirectUrl?: string }) {
  const router = useRouter();
  const { user, signIn, signUp, signInWithGoogle } = useAuth();
  const { t } = useTranslation();
  const { getLocalizedPath } = useLanguageNavigation();

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [rememberMe, setRememberMe] = useState(true);

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);



  useEffect(() => {
    if (user) router.navigate({ href: redirectUrl || getLocalizedPath("/"), replace: true });
  }, [user, redirectUrl, router, getLocalizedPath]);

  // Écoute et synchronisation automatique de la connexion officielle Google OAuth
  useEffect(() => {
    let active = true;

    // 1. Écoute de l'événement Supabase OAuth officiel
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN" && session?.user?.email && active) {
          setGoogleLoading(true);
          try {
            const email = session.user.email;
            const fullName =
              session.user.user_metadata?.full_name ||
              session.user.user_metadata?.name ||
              email.split("@")[0];
            const avatarUrl =
              session.user.user_metadata?.avatar_url ||
              session.user.user_metadata?.picture ||
              "";

            await signInWithGoogle({ email, fullName, avatarUrl });
            toast.success(t("auth.signedInToast", `Connecté avec succès via Google (${email}) !`));
            router.navigate({ href: redirectUrl || getLocalizedPath("/"), replace: true });
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Erreur d'authentification Google.");
          } finally {
            if (active) setGoogleLoading(false);
          }
        }
      }
    );

    // 2. Vérification au chargement si un jeton OAuth est présent dans l'URL
    async function checkOAuthCallback() {
      if (
        typeof window !== "undefined" &&
        (window.location.hash.includes("access_token") || window.location.search.includes("code"))
      ) {
        setGoogleLoading(true);
        try {
          const { data: { session }, error } = await supabase.auth.getSession();
          if (!error && session?.user?.email && active) {
            const email = session.user.email;
            const fullName =
              session.user.user_metadata?.full_name ||
              session.user.user_metadata?.name ||
              email.split("@")[0];
            const avatarUrl =
              session.user.user_metadata?.avatar_url ||
              session.user.user_metadata?.picture ||
              "";

            await signInWithGoogle({ email, fullName, avatarUrl });
            toast.success(t("auth.signedInToast", `Connecté avec succès via Google (${email}) !`));
            router.navigate({ href: redirectUrl || getLocalizedPath("/"), replace: true });
          }
        } catch (err) {
          console.error("[OAuth Callback Error]", err);
        } finally {
          if (active) setGoogleLoading(false);
        }
      }
    }

    checkOAuthCallback();

    return () => {
      active = false;
      subscription?.unsubscribe();
    };
  }, [signInWithGoogle, redirectUrl, router, t, getLocalizedPath]);

  // Déclenchement de la connexion officielle Google
  async function handleGoogleSignIn() {
    setGoogleLoading(true);
    try {
      const redirectUri = window.location.origin + getLocalizedPath("/auth");
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUri,
        },
      });

      if (error) {
        toast.error(error.message || "Erreur lors de l'accès à Google.");
        setGoogleLoading(false);
      }
      // La redirection vers la page officielle de Google accounts.google.com s'exécute automatiquement
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Impossible de lancer la connexion Google.");
      setGoogleLoading(false);
    }
  }

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        await signUp({ email, password, fullName, phone });
        toast.success(t("auth.createdToast", "Compte créé avec succès ! Bienvenue chez Cereals House."));
      } else {
        await signIn(email, password);
        toast.success(t("auth.signedInToast", "Connexion réussie ! Bon retour."));
      }
      router.navigate({ href: redirectUrl || getLocalizedPath("/"), replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("auth.errorGeneric", "Erreur d'authentification"));
    } finally {
      setLoading(false);
    }
  }

  const passStrength = getPasswordStrength(password);

  return (
    <div className="relative min-h-[calc(100vh-4rem)] pt-24 sm:pt-32 pb-16 sm:pb-24 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      {/* Halo d'ambiance doré subtil en arrière-plan */}
      <div className="pointer-events-none absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-3xl opacity-50" />

      {/* ─── CONTENEUR PRINCIPAL HAUTE FIDÉLITÉ (Card-Atelier Designer) ─── */}
      <div className="relative w-full max-w-5xl xl:max-w-6xl rounded-3xl sm:rounded-[2.5rem] border border-stone-200/90 bg-white shadow-2xl shadow-stone-900/10 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[640px]">
        {/* ============================================================== */}
        {/* COLONNE GAUCHE : FORMULAIRE PRO & ÉPURÉ (7 Cols sur desktop) */}
        {/* ============================================================== */}
        <div className="lg:col-span-7 p-6 sm:p-10 lg:p-12 xl:p-14 flex flex-col justify-between bg-white">
          <div className="max-w-md mx-auto w-full">
            {/* Lien retour & Identité */}
            <div className="flex items-center justify-between gap-4 mb-8">
              <Link
                to={getLocalizedPath("/")}
                className="group inline-flex items-center gap-2 text-xs font-semibold text-stone-500 hover:text-amber-800 transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1 text-stone-400 group-hover:text-amber-800" />
                <span>{t("auth.back", "Retour à la boutique")}</span>
              </Link>

              <div className="flex items-center gap-2.5">
                <img
                  src={logo}
                  alt="Cereals House"
                  className="h-8 w-8 rounded-full object-cover ring-1 ring-amber-500/30 shadow-xs"
                />
                <span className="font-display text-sm font-bold text-stone-900">
                  Cereals <span className="text-gold font-serif italic">House</span>
                </span>
              </div>
            </div>

            {/* Sélecteur d'Onglets Fluide (Glissement tactile style iOS/macOS) */}
            <div className="relative p-1 rounded-2xl bg-stone-100/90 border border-stone-200/80 flex items-center mb-7">
              {/* Fond glissant animé */}
              <div
                className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-xl bg-white shadow-sm border border-stone-200/60 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                  mode === "signin" ? "left-1" : "left-[calc(50%+2px)]"
                }`}
              />
              <button
                type="button"
                onClick={() => setMode("signin")}
                className={`relative z-10 flex-1 py-2.5 text-xs sm:text-sm font-bold transition-colors cursor-pointer text-center ${
                  mode === "signin" ? "text-stone-950" : "text-stone-500 hover:text-stone-800"
                }`}
              >
                {t("auth.tabSignIn", "Connexion")}
              </button>
              <button
                type="button"
                onClick={() => setMode("signup")}
                className={`relative z-10 flex-1 py-2.5 text-xs sm:text-sm font-bold transition-colors cursor-pointer text-center ${
                  mode === "signup" ? "text-stone-950" : "text-stone-500 hover:text-stone-800"
                }`}
              >
                {t("auth.tabSignUp", "Inscription")}
              </button>
            </div>

            {/* Titre & Sous-titre */}
            <div className="space-y-1.5 mb-7">
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-stone-950 tracking-tight">
                {mode === "signin"
                  ? t("auth.signInTitle", "Heureux de vous revoir")
                  : t("auth.signUpTitle", "Créer votre compte client")}
              </h1>
              <p className="text-xs sm:text-sm text-stone-500 leading-relaxed font-light">
                {mode === "signin"
                  ? t(
                      "auth.signInSubtitle",
                      "Accédez à votre espace sécurisé, vos adresses et le suivi de vos commandes.",
                    )
                  : t(
                      "auth.signUpSubtitle",
                      "Rejoignez Cereals House pour commander vos céréales favorites en quelques clics.",
                    )}
              </p>
            </div>

            {/* Bouton Google Stylisé avec micro-interaction */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
              className="w-full flex items-center justify-center gap-3 rounded-xl border border-stone-200/90 bg-stone-50/50 hover:bg-white py-3 px-4 text-xs sm:text-sm font-semibold text-stone-800 shadow-2xs hover:border-amber-400/80 hover:shadow-xs active:scale-[0.99] transition-all duration-200 cursor-pointer disabled:opacity-50 mb-6"
            >
              {googleLoading ? (
                <Loader2 className="h-4 w-4 animate-spin text-amber-600" />
              ) : (
                <GoogleIcon />
              )}
              <span>{t("auth.google", "Continuer avec Google")}</span>
            </button>

            {/* Séparateur élégant */}
            <div className="relative flex items-center justify-center mb-6">
              <div className="border-t border-stone-200 w-full" />
              <span className="bg-white px-3 text-[10px] font-bold uppercase tracking-wider text-stone-400 shrink-0">
                {t("auth.or", "OU AVEC VOTRE EMAIL")}
              </span>
              <div className="border-t border-stone-200 w-full" />
            </div>

            {/* Formulaire Email */}
            <form onSubmit={handleEmail} className="space-y-4">
              {/* Nom complet (Inscription uniquement) */}
              {mode === "signup" && (
                <div className="space-y-1.5 animate-in fade-in duration-200">
                  <label className="block text-xs font-semibold text-stone-800">
                    {t("auth.fullName", "Nom complet *")}
                  </label>
                  <div className="relative group">
                    <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 group-focus-within:text-amber-600 transition-colors" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="ex : Marie Koné"
                      className="w-full rounded-xl border border-stone-200 bg-stone-50/40 hover:bg-white pl-10 pr-4 py-2.5 sm:py-3 text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 shadow-2xs transition-all focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-3 focus:ring-amber-500/15"
                    />
                  </div>
                </div>
              )}

              {/* Adresse Email */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-stone-800">
                  {t("auth.email", "Adresse email *")}
                </label>
                <div className="relative group">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 group-focus-within:text-amber-600 transition-colors" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="votre.email@exemple.com"
                    className="w-full rounded-xl border border-stone-200 bg-stone-50/40 hover:bg-white pl-10 pr-4 py-2.5 sm:py-3 text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 shadow-2xs transition-all focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-3 focus:ring-amber-500/15"
                  />
                </div>
              </div>

              {/* Téléphone (Inscription uniquement) */}
              {mode === "signup" && (
                <div className="space-y-1.5 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-stone-800">
                      {t("auth.phone", "Téléphone / WhatsApp")}
                    </label>
                    <span className="text-[10px] text-stone-400">Pour le suivi de livraison</span>
                  </div>
                  <div className="relative group">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 group-focus-within:text-amber-600 transition-colors" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+225 07 00 00 00 00"
                      className="w-full rounded-xl border border-stone-200 bg-stone-50/40 hover:bg-white pl-10 pr-4 py-2.5 sm:py-3 text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 shadow-2xs transition-all focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-3 focus:ring-amber-500/15"
                    />
                  </div>
                </div>
              )}

              {/* Mot de passe */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-stone-800">
                    {t("auth.password", "Mot de passe *")}
                  </label>
                  {mode === "signin" && (
                    <button
                      type="button"
                      onClick={() =>
                        toast.info(
                          "Pour réinitialiser votre mot de passe, contactez notre service client WhatsApp ou écrivez à contact@cereals-house.com",
                        )
                      }
                      className="text-[11px] text-amber-700 hover:text-amber-900 font-semibold transition-colors cursor-pointer"
                    >
                      Mot de passe oublié ?
                    </button>
                  )}
                </div>

                <div className="relative group">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 group-focus-within:text-amber-600 transition-colors" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-stone-200 bg-stone-50/40 hover:bg-white pl-10 pr-10 py-2.5 sm:py-3 text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 shadow-2xs transition-all focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-3 focus:ring-amber-500/15"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 transition cursor-pointer p-1"
                    title={showPassword ? "Masquer" : "Afficher"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                {/* Indicateur de force du mot de passe en mode Inscription */}
                {mode === "signup" && password.length > 0 && (
                  <div className="pt-1.5 space-y-1 animate-in fade-in duration-200">
                    <div className="flex gap-1.5 h-1">
                      {[1, 2, 3, 4].map((step) => (
                        <div
                          key={step}
                          className={`flex-1 rounded-full transition-all duration-300 ${
                            passStrength.score >= step ? passStrength.color : "bg-stone-200"
                          }`}
                        />
                      ))}
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-stone-500">
                      <span>Force : {passStrength.label}</span>
                      <span>8 caractères min. recommandés</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Se souvenir de moi (Mode Connexion) */}
              {mode === "signin" && (
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="rememberMe"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-stone-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                  />
                  <label htmlFor="rememberMe" className="text-xs text-stone-600 cursor-pointer select-none">
                    Rester connecté sur cet appareil
                  </label>
                </div>
              )}

              {/* Bouton de Soumission Principal Élégant */}
              <button
                type="submit"
                disabled={loading}
                className="w-full group relative overflow-hidden flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-500 py-3.5 px-6 text-xs sm:text-sm font-bold text-stone-950 shadow-md shadow-amber-500/20 hover:shadow-lg hover:shadow-amber-500/30 transition-all duration-300 active:scale-[0.99] cursor-pointer disabled:opacity-50 mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-stone-950" />
                    <span>{t("common.loading", "Vérification en cours…")}</span>
                  </>
                ) : (
                  <>
                    <span>
                      {mode === "signin"
                        ? t("auth.signInBtn", "Se connecter à mon compte")
                        : t("auth.signUpBtn", "Créer mon compte client")}
                    </span>
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            {/* Lien de bascule alternatif */}
            <div className="mt-8 text-center text-xs text-stone-500 font-light">
              {mode === "signin" ? (
                <span>
                  {t("auth.noAccount", "Pas encore de compte client ?")}{" "}
                  <button
                    type="button"
                    onClick={() => setMode("signup")}
                    className="font-bold text-amber-800 hover:text-amber-950 hover:underline cursor-pointer"
                  >
                    {t("auth.goSignUp", "Créer un compte")}
                  </button>
                </span>
              ) : (
                <span>
                  {t("auth.haveAccount", "Vous avez déjà un compte ?")}{" "}
                  <button
                    type="button"
                    onClick={() => setMode("signin")}
                    className="font-bold text-amber-800 hover:text-amber-950 hover:underline cursor-pointer"
                  >
                    {t("auth.goSignIn", "Se connecter")}
                  </button>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* COLONNE DROITE : VISUEL HERO SUBLIME SANS TEXTE SUPERFLU       */}
        {/* ============================================================== */}
        <div className="relative hidden lg:flex lg:col-span-5 flex-col justify-between overflow-hidden bg-stone-900 border-l border-stone-200/80">
          {/* Photo éclatante du Hero (Céréales Mixtes Pack) */}
          <img
            src={heroPhoto}
            alt="Cereals House - Terroirs d'Afrique"
            className="absolute inset-0 h-full w-full object-cover object-center"
          />

          {/* Dégradé doux et léger uniquement en haut et en bas pour détacher les badges */}
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950/85 via-stone-950/15 to-stone-950/45" />

          {/* Pastilles en haut */}
          <div className="relative z-10 p-6 xl:p-8 flex items-center justify-between">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-stone-950/60 backdrop-blur-md px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-amber-300 shadow-md">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              <span>Maison Cereals House</span>
            </div>

            <div className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-stone-950/60 backdrop-blur-md px-3 py-1 text-xs font-semibold text-amber-300 shadow-md">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              <span>4.9 / 5</span>
            </div>
          </div>

          {/* Cartouche sobre et moderne au bas */}
          <div className="relative z-10 p-6 xl:p-8">
            <div className="rounded-2xl border border-white/20 bg-stone-950/75 backdrop-blur-md p-5 text-white shadow-xl space-y-2">
              <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-white leading-snug">
                L'Excellence des Terroirs <span className="font-editorial text-amber-400 font-normal">à votre table</span>
              </h2>
              <p className="text-xs sm:text-sm text-stone-200 font-light leading-relaxed">
                Farines et céréales pures, 100% garanties sans sable et prêtes en 3 minutes.
              </p>

              <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-stone-300">
                <span className="inline-flex items-center gap-1.5 text-amber-300 font-medium">
                  <BadgeCheck className="h-4 w-4" />
                  <span>Zéro sable garanti</span>
                </span>
                <span className="text-stone-300 font-light">Mouture meule de pierre</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
