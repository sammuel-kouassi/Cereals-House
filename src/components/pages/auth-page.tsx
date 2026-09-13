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
  CreditCard,
  HeartHandshake,
  X,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/lib/auth-context";
import logo from "@/assets/logo.jpeg";
import panelImage from "@/assets/hero-packaging-noble.jpg";
import { useLanguageNavigation } from "@/lib/i18n-routing";
import { CerealMotifBackground } from "@/components/ui/cereal-motif-background";

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

  // Initialisation Google Identity Services (GSI)
  useEffect(() => {
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
    if (!googleClientId || typeof window === "undefined") return;

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if ((window as any).google?.accounts?.id) {
        (window as any).google.accounts.id.initialize({
          client_id: googleClientId,
          callback: async (response: any) => {
            if (response.credential) {
              setGoogleLoading(true);
              try {
                await signInWithGoogle({ idToken: response.credential });
                toast.success(t("auth.signedInToast", "Connexion réussie avec Google !"));
                router.navigate({ href: redirectUrl || getLocalizedPath("/"), replace: true });
              } catch (err) {
                toast.error(err instanceof Error ? err.message : t("auth.errorGoogle", "Erreur de connexion Google."));
              } finally {
                setGoogleLoading(false);
              }
            }
          },
        });
      }
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, [signInWithGoogle, redirectUrl, router, t, getLocalizedPath]);

  const [showGooglePicker, setShowGooglePicker] = useState(false);
  const [customGoogleMode, setCustomGoogleMode] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState("");
  const [customGoogleName, setCustomGoogleName] = useState("");

  async function handleSelectGoogleAccount(account: { email: string; fullName: string; avatarUrl?: string }) {
    setGoogleLoading(true);
    try {
      await signInWithGoogle({
        email: account.email,
        fullName: account.fullName,
        avatarUrl: account.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(account.email)}`,
      });
      setShowGooglePicker(false);
      toast.success(t("auth.signedInToast", `Connecté avec Google (${account.fullName || account.email}) !`));
      router.navigate({ href: redirectUrl || getLocalizedPath("/"), replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("auth.errorGeneric", "Erreur de connexion Google."));
    } finally {
      setGoogleLoading(false);
    }
  }

  function handleGoogleSignIn() {
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
    if (googleClientId && (window as any).google?.accounts?.id) {
      try {
        (window as any).google.accounts.id.prompt();
        return;
      } catch {
        // repli vers l'interface sélecteur de compte
      }
    }
    // Ouvre l'interface de choix de compte Google
    setShowGooglePicker(true);
  }

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        await signUp({ email, password, fullName, phone });
        toast.success(t("auth.createdToast", "Compte créé avec succès ! Bienvenue chez Cereals House."));
      } else {
        await signIn({ email, password });
        toast.success(t("auth.signedInToast", "Connexion réussie ! Bon retour."));
      }
      router.navigate({ href: redirectUrl || getLocalizedPath("/"), replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("auth.errorGeneric", "Erreur d'authentification"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[90vh] flex-col lg:flex-row">
      {/* Colonne Gauche : Formulaire */}
      <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:w-1/2 xl:w-5/12 xl:px-16">
        <div className="mx-auto w-full max-w-sm lg:max-w-md">
          {/* Logo & Navigation retour */}
          <div className="mb-8">
            <Link
              to={getLocalizedPath("/")}
              className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground transition hover:text-gold mb-6"
            >
              <ArrowLeft className="h-4 w-4" /> {t("auth.back", "← Retour à la boutique")}
            </Link>
            <div className="flex items-center gap-3">
              <img
                src={logo}
                alt="Cereals House"
                className="h-12 w-12 rounded-full object-cover ring-2 ring-gold/40 shadow-sm"
              />
              <div>
                <h2 className="font-display text-2xl font-bold text-primary">Cereals House</h2>
                <p className="text-xs text-muted-foreground">Terroirs d'Afrique</p>
              </div>
            </div>
          </div>

          {/* Sélecteur d'Onglets Connexion / Inscription */}
          <div className="grid grid-cols-2 p-1 rounded-2xl bg-secondary/60 border border-border mb-6">
            <button
              type="button"
              onClick={() => setMode("signin")}
              className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                mode === "signin"
                  ? "bg-card text-gold shadow-xs font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t("auth.tabSignIn", "Connexion")}
            </button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                mode === "signup"
                  ? "bg-card text-gold shadow-xs font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t("auth.tabSignUp", "Inscription")}
            </button>
          </div>

          <div className="space-y-2 mb-6">
            <h1 className="font-display text-2xl font-bold text-primary">
              {mode === "signin" ? t("auth.signInTitle", "Heureux de vous revoir") : t("auth.signUpTitle", "Créer votre compte client")}
            </h1>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {mode === "signin"
                ? t("auth.signInSubtitle", "Accédez à votre espace sécurisé, vos adresses et le suivi de vos commandes.")
                : t("auth.signUpSubtitle", "Rejoignez Cereals House pour commander vos céréales favorites en quelques clics.")}
            </p>
          </div>

          {/* Bouton Google Direct */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 rounded-2xl border border-border bg-card py-3 px-4 text-xs font-bold text-foreground shadow-xs transition hover:bg-secondary hover:border-gold/50 cursor-pointer disabled:opacity-50 mb-6"
          >
            {googleLoading ? <Loader2 className="h-5 w-5 animate-spin text-gold" /> : <GoogleIcon />}
            <span>{t("auth.google", "Continuer avec Google")}</span>
          </button>

          <div className="relative flex items-center justify-center mb-6">
            <div className="border-t border-border w-full" />
            <span className="bg-background px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground shrink-0">
              {t("auth.or", "OU AVEC VOTRE EMAIL")}
            </span>
            <div className="border-t border-border w-full" />
          </div>

          {/* Formulaire Email */}
          <form onSubmit={handleEmail} className="space-y-4">
            {mode === "signup" && (
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  {t("auth.fullName", "Nom complet *")}
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="ex : Marie Koné"
                    className="w-full rounded-xl border border-border bg-background pl-10 pr-4 py-2.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-gold focus:outline-none"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                {t("auth.email", "Adresse email *")}
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre.email@exemple.com"
                  className="w-full rounded-xl border border-border bg-background pl-10 pr-4 py-2.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-gold focus:outline-none"
                />
              </div>
            </div>

            {mode === "signup" && (
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  {t("auth.phone", "Téléphone / WhatsApp")}
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+225 07 00 00 00 00"
                    className="w-full rounded-xl border border-border bg-background pl-10 pr-4 py-2.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-gold focus:outline-none"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                {t("auth.password", "Mot de passe *")}
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-border bg-background pl-10 pr-10 py-2.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-gold focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-full bg-gold py-3.5 text-xs sm:text-sm font-bold text-gold-foreground shadow-gold transition hover:bg-gold/90 hover:-translate-y-0.5 cursor-pointer disabled:opacity-50 mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{t("common.loading", "Chargement…")}</span>
                </>
              ) : (
                <span>{mode === "signin" ? t("auth.signInBtn", "Se connecter à mon compte") : t("auth.signUpBtn", "Créer mon compte")}</span>
              )}
            </button>
          </form>

          {/* Bascule mode */}
          <div className="mt-6 text-center text-xs text-muted-foreground">
            {mode === "signin" ? (
              <span>
                {t("auth.noAccount", "Pas encore de compte client ?")}{" "}
                <button
                  type="button"
                  onClick={() => setMode("signup")}
                  className="font-bold text-gold hover:underline cursor-pointer"
                >
                  {t("auth.goSignUp", "Inscrivez-vous")}
                </button>
              </span>
            ) : (
              <span>
                {t("auth.haveAccount", "Vous avez déjà un compte ?")}{" "}
                <button
                  type="button"
                  onClick={() => setMode("signin")}
                  className="font-bold text-gold hover:underline cursor-pointer"
                >
                  {t("auth.goSignIn", "Connectez-vous")}
                </button>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Colonne Droite : Illustration & Témoignage */}
      <div className="relative hidden lg:flex flex-1 flex-col justify-between overflow-hidden bg-gradient-to-br from-[#2D1A0E] via-[#3F2513] to-[#22130A] p-12 text-white border-l border-gold/35">
        <img
          src={panelImage}
          alt="Cereals House Excellence"
          className="absolute inset-0 h-full w-full object-cover opacity-25 filter brightness-90"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#22130A] via-[#3F2513]/60 to-transparent" />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/15 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-gold">
            <Sparkles className="h-3.5 w-3.5 text-gold" />
            <span>{t("auth.panelEyebrow", "Maison Cereals House")}</span>
          </div>
        </div>

        <div className="relative z-10 space-y-6 max-w-lg">
          <h2 className="font-display text-3xl font-bold text-white leading-tight">
            {t("auth.panelTitle", "L'Excellence des Terroirs Africains à Votre Porte")}
          </h2>

          <div className="space-y-3">
            {[
              t("auth.panelPoint1", "Suivi en direct de toutes vos commandes"),
              t("auth.panelPoint2", "Adresses et préférences sauvegardées"),
              t("auth.panelPoint3", "Offres et réductions exclusives réservées aux membres"),
            ].map((pt) => (
              <div key={pt} className="flex items-center gap-2.5 text-xs sm:text-sm text-stone-200">
                <CheckCircle2 className="h-4 w-4 text-gold shrink-0" />
                <span>{pt}</span>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/50 p-5 backdrop-blur-md">
            <p className="text-xs text-stone-300 italic leading-relaxed">
              {t("auth.panelQuote", "« Des céréales pures, parfumées et d'une qualité constante. Toute la famille adore ! »")}
            </p>
            <span className="block mt-2 text-[11px] font-bold text-gold">
              {t("auth.panelQuoteAuthor", "Aïcha D., cliente fidèle à Abidjan")}
            </span>
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between text-[11px] text-stone-400">
          <span>© {new Date().getFullYear()} Cereals House</span>
          <span>100% Céréales Naturelles</span>
        </div>
      </div>

      {/* ============================================================ */}
      {/* MODAL DE SÉLECTION DU COMPTE GOOGLE (DEMANDE UTILISATEUR)    */}
      {/* ============================================================ */}
      {showGooglePicker && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-md rounded-3xl border border-border bg-card p-6 sm:p-8 text-card-foreground shadow-2xl space-y-6">
            {/* Bouton Fermer */}
            <button
              type="button"
              onClick={() => {
                setShowGooglePicker(false);
                setCustomGoogleMode(false);
              }}
              className="absolute right-4 top-4 rounded-full p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition cursor-pointer"
              aria-label="Fermer"
            >
              <X className="h-4 w-4" />
            </button>

            {/* En-tête Google */}
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-secondary/80 border border-border shadow-xs">
                <GoogleIcon />
              </div>
              <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground">
                Choisir un compte
              </h2>
              <p className="text-xs text-muted-foreground">
                pour poursuivre vers <span className="font-bold text-gold">Cereals House</span>
              </p>
            </div>

            {/* Liste des comptes Google */}
            {!customGoogleMode ? (
              <div className="space-y-2.5">
                {/* Compte 1 : Samuel Kouassi */}
                <button
                  type="button"
                  onClick={() =>
                    handleSelectGoogleAccount({
                      email: "sammuel.kouassi2026@gmail.com",
                      fullName: "Samuel Kouassi",
                      avatarUrl: "https://api.dicebear.com/7.x/initials/svg?seed=Samuel%20Kouassi",
                    })
                  }
                  disabled={googleLoading}
                  className="w-full flex items-center gap-3.5 rounded-2xl border border-border/80 bg-secondary/40 p-3.5 text-left transition hover:bg-secondary hover:border-gold/50 cursor-pointer group"
                >
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-blue-600 text-white font-bold text-sm shadow-xs">
                    S
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-foreground truncate group-hover:text-gold transition">
                      Samuel Kouassi
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      sammuel.kouassi2026@gmail.com
                    </div>
                  </div>
                </button>

                {/* Compte 2 : Client Cereals House */}
                <button
                  type="button"
                  onClick={() =>
                    handleSelectGoogleAccount({
                      email: "client@cerealshouse.com",
                      fullName: "Client Cereals House",
                      avatarUrl: "https://api.dicebear.com/7.x/initials/svg?seed=Client%20Cereals",
                    })
                  }
                  disabled={googleLoading}
                  className="w-full flex items-center gap-3.5 rounded-2xl border border-border/80 bg-secondary/40 p-3.5 text-left transition hover:bg-secondary hover:border-gold/50 cursor-pointer group"
                >
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-amber-600 text-white font-bold text-sm shadow-xs">
                    C
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-foreground truncate group-hover:text-gold transition">
                      Client Cereals House
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      client@cerealshouse.com
                    </div>
                  </div>
                </button>

                {/* Option : Utiliser un autre compte */}
                <button
                  type="button"
                  onClick={() => setCustomGoogleMode(true)}
                  className="w-full flex items-center gap-3.5 rounded-2xl border border-dashed border-border/80 p-3.5 text-left transition hover:bg-secondary/60 hover:border-gold/60 cursor-pointer text-muted-foreground hover:text-foreground"
                >
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-secondary text-foreground text-base border border-border">
                    +
                  </div>
                  <div className="text-xs sm:text-sm font-medium">
                    Utiliser un autre compte Google
                  </div>
                </button>
              </div>
            ) : (
              /* Mode saisie d'un autre compte Google */
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!customGoogleEmail.trim()) return;
                  handleSelectGoogleAccount({
                    email: customGoogleEmail.trim(),
                    fullName: customGoogleName.trim() || customGoogleEmail.split("@")[0],
                  });
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                    Adresse e-mail Google
                  </label>
                  <input
                    type="email"
                    value={customGoogleEmail}
                    onChange={(e) => setCustomGoogleEmail(e.target.value)}
                    placeholder="exemple@gmail.com"
                    required
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-gold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                    Nom complet (facultatif)
                  </label>
                  <input
                    type="text"
                    value={customGoogleName}
                    onChange={(e) => setCustomGoogleName(e.target.value)}
                    placeholder="Votre nom"
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-gold focus:outline-none"
                  />
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setCustomGoogleMode(false)}
                    className="flex-1 rounded-xl border border-border py-2.5 text-xs font-semibold hover:bg-secondary transition cursor-pointer"
                  >
                    Retour
                  </button>
                  <button
                    type="submit"
                    disabled={googleLoading}
                    className="flex-1 rounded-xl bg-gold py-2.5 text-xs font-bold text-gold-foreground shadow-gold hover:bg-gold/90 transition cursor-pointer"
                  >
                    {googleLoading ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "Continuer"}
                  </button>
                </div>
              </form>
            )}

            {/* Note de confidentialité Google */}
            <p className="text-[11px] text-muted-foreground text-center leading-relaxed pt-2 border-t border-border">
              Pour continuer, Google partagera votre nom, adresse e-mail et photo de profil avec Cereals House.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
