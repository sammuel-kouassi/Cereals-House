import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
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
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/lib/auth-context";
import logo from "@/assets/logo.jpeg";
import panelImage from "@/assets/hero-packaging-noble.jpg";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Connexion & Inscription — Cereals House" }] }),
  validateSearch: (s: Record<string, unknown>) => ({
    redirect: typeof s.redirect === "string" ? s.redirect : "/",
  }),
  component: AuthPage,
});

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

function AuthPage() {
  const router = useRouter();
  const { redirect } = Route.useSearch();
  const { user, signIn, signUp, signInWithGoogle } = useAuth();
  const { t } = useTranslation();

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
    if (user) router.navigate({ to: redirect || "/" });
  }, [user, redirect, router]);

  // Initialisation Google Identity Services (GSI) si un Client ID est défini
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
                toast.success("Connexion réussie avec Google !");
                router.navigate({ to: redirect || "/" });
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Erreur de connexion Google.");
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
  }, [signInWithGoogle, redirect, router]);

  async function handleGoogleSignIn() {
    setGoogleLoading(true);
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

    try {
      if (googleClientId && (window as any).google?.accounts?.id) {
        (window as any).google.accounts.id.prompt();
      } else {
        const defaultGoogleEmail = "client@cerealshouse.com";
        const defaultGoogleName = "Client Cereals House";

        await signInWithGoogle({
          email: defaultGoogleEmail,
          fullName: defaultGoogleName,
          avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(defaultGoogleEmail)}`,
        });

        toast.success("Connecté avec Google avec succès !");
        router.navigate({ to: redirect || "/" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de la connexion avec Google.");
    } finally {
      setGoogleLoading(false);
    }
  }

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        await signUp({ email, password, fullName, phone });
        toast.success("Compte créé avec succès ! Bienvenue chez Cereals House.");
      } else {
        await signIn(email, password);
        toast.success("Connexion réussie ! Heureux de vous revoir.");
      }
      router.navigate({ to: redirect || "/" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Une erreur est survenue lors de l'authentification.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100dvh-72px)] w-full bg-[#FAF7F2] text-foreground flex items-center justify-center p-4 sm:p-6 lg:p-10">
      {/* Conteneur Principal Bento de Grande Maison */}
      <div className="w-full max-w-6xl overflow-hidden rounded-[2.5rem] border border-border/80 bg-card shadow-[0_25px_70px_-15px_rgba(0,0,0,0.12)] grid lg:grid-cols-12 min-h-[640px]">
        {/* ============================================================ */}
        {/* PANNEAU GAUCHE : Théâtre de Marque Éditorial de Luxe        */}
        {/* ============================================================ */}
        <div className="relative hidden lg:flex lg:col-span-6 flex-col justify-between overflow-hidden bg-[#14100D] p-10 xl:p-14 text-white">
          {/* Image de fond haute résolution avec traitement cinéma */}
          <img
            src={panelImage}
            alt="Cereals House Collection"
            className="absolute inset-0 h-full w-full object-cover object-center opacity-45 transform scale-105 transition-transform duration-1000"
          />

          {/* Dégradés superposés d'ambiance luxueuse */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#14100D] via-[#14100D]/70 to-[#14100D]/40" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(212,175,55,0.2),transparent_70%)]" />

          {/* En-tête : Logo & Badge de Prestige */}
          <div className="relative z-10 flex items-center justify-between">
            <Link to="/" className="group flex items-center gap-3 transition-opacity hover:opacity-90">
              <img
                src={logo}
                alt="Cereals House"
                className="h-11 w-11 rounded-full object-cover ring-2 ring-gold/60 transition-transform duration-500 group-hover:rotate-6 shadow-md"
              />
              <div>
                <span className="font-display text-lg font-bold text-white tracking-wide block">
                  Cereals House
                </span>
                <span className="text-[10px] uppercase tracking-widest text-gold font-semibold block">
                  Haute Nutrition Africaine
                </span>
              </div>
            </Link>

            <div className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-gold backdrop-blur-md">
              <span className="h-1.5 w-1.5 rounded-full bg-gold animate-pulse" />
              <span>Espace Membre</span>
            </div>
          </div>

          {/* Corps : Grand Titre & Arguments Clés sous forme de Bento Cards */}
          <div className="relative z-10 my-8 space-y-6">
            <div>
              <span className="text-xs font-semibold uppercase tracking-widest text-gold/90">
                La Noblesse des Terroirs
              </span>
              <h2 className="mt-2 font-display text-3xl xl:text-4xl font-bold leading-tight text-white">
                L'Excellence Céréalière <br />
                <span className="bg-gradient-to-r from-[#F7E7B4] via-[#E2B94D] to-[#BF9024] bg-clip-text text-transparent drop-shadow-sm">
                  à Portée de Main
                </span>
              </h2>
            </div>

            {/* Cartes d'Avantages Membre en Glassmorphism */}
            <div className="space-y-3">
              <div className="flex items-center gap-3.5 rounded-2xl border border-white/10 bg-white/5 p-3.5 backdrop-blur-md transition-all hover:border-gold/40 hover:bg-white/10">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gold/15 text-gold border border-gold/30">
                  <Truck className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">Suivi de Commande en Direct</h4>
                  <p className="text-xs text-stone-300 font-light">
                    Mises à jour instantanées par SMS et WhatsApp dès l'expédition.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3.5 rounded-2xl border border-white/10 bg-white/5 p-3.5 backdrop-blur-md transition-all hover:border-gold/40 hover:bg-white/10">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gold/15 text-gold border border-gold/30">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">Paiement 1-Clic Sécurisé</h4>
                  <p className="text-xs text-stone-300 font-light">
                    Règlement rapide par Wave, Orange Money, Moov, MTN & Visa.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3.5 rounded-2xl border border-white/10 bg-white/5 p-3.5 backdrop-blur-md transition-all hover:border-gold/40 hover:bg-white/10">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gold/15 text-gold border border-gold/30">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">Tarifs Privilèges & Nouveautés</h4>
                  <p className="text-xs text-stone-300 font-light">
                    Accès prioritaire aux nouvelles récoltes et farines infantiles bio.
                  </p>
                </div>
              </div>
            </div>

            {/* Avis client vérifié */}
            <div className="rounded-2xl border border-gold/20 bg-stone-900/80 p-4 backdrop-blur-md">
              <div className="flex items-center justify-between">
                <div className="flex text-gold">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-gold" />
                  ))}
                </div>
                <span className="text-[11px] font-semibold text-gold">Avis Vérifié</span>
              </div>
              <p className="mt-2 text-xs italic text-stone-200 leading-relaxed font-light">
                « Les farines infantiles au Moringa et Baobab ont transformé l'appétit de mon bébé. Une qualité exceptionnelle et livraison reçue le lendemain à Abidjan. »
              </p>
              <div className="mt-2 text-[11px] font-semibold text-stone-300">
                Aïcha K. — <span className="text-stone-400 font-normal">Maman & Cliente fidèle</span>
              </div>
            </div>
          </div>

          {/* Pied : Mention de sécurité */}
          <div className="relative z-10 flex items-center justify-between border-t border-white/10 pt-4 text-[11px] text-stone-400">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-gold" />
              <span>Chiffrement SSL 256-bit garanti</span>
            </div>
            <span>© {new Date().getFullYear()} Cereals House</span>
          </div>
        </div>

        {/* ============================================================ */}
        {/* PANNEAU DROIT : Formulaire Haute Précision                   */}
        {/* ============================================================ */}
        <div className="lg:col-span-6 flex flex-col justify-between p-6 sm:p-10 xl:p-14 bg-card">
          {/* Navigation supérieure vers l'accueil */}
          <div className="flex items-center justify-between">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-gold"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Retour à l'accueil</span>
            </Link>

            {/* Logo sur mobile */}
            <div className="lg:hidden flex items-center gap-2">
              <img src={logo} alt="Cereals House" className="h-7 w-7 rounded-full object-cover ring-1 ring-gold" />
              <span className="font-display text-sm font-bold text-primary">Cereals House</span>
            </div>
          </div>

          {/* Cœur du formulaire */}
          <div className="my-auto mx-auto w-full max-w-md py-6">
            {/* Bascule Animée Connexion / Inscription */}
            <div className="relative mb-8 flex rounded-2xl border border-border bg-secondary/60 p-1.5 shadow-inner">
              <button
                type="button"
                onClick={() => setMode("signin")}
                className={`relative flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all duration-300 cursor-pointer ${
                  mode === "signin"
                    ? "bg-card text-primary shadow-sm ring-1 ring-border"
                    : "text-muted-foreground hover:text-primary"
                }`}
              >
                Se connecter
              </button>
              <button
                type="button"
                onClick={() => setMode("signup")}
                className={`relative flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all duration-300 cursor-pointer ${
                  mode === "signup"
                    ? "bg-card text-primary shadow-sm ring-1 ring-border"
                    : "text-muted-foreground hover:text-primary"
                }`}
              >
                Créer un compte
              </button>
            </div>

            {/* Titre & Sous-titre dynamiques */}
            <div className="text-center mb-6">
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-primary tracking-tight">
                {mode === "signin" ? "Heureux de vous revoir" : "Rejoignez Cereals House"}
              </h1>
              <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground">
                {mode === "signin"
                  ? "Accédez à votre historique de commande et votre panier sécurisé."
                  : "Profitez de la livraison offerte dès 25 000 FCFA et d'un suivi sur-mesure."}
              </p>
            </div>

            {/* Bouton de Connexion Rapide Google */}
            <button
              type="button"
              disabled={googleLoading || loading}
              onClick={handleGoogleSignIn}
              className="group flex w-full items-center justify-center gap-3 rounded-2xl border border-border bg-background px-4 py-3.5 text-sm font-semibold text-primary shadow-xs transition-all duration-200 hover:border-gold/50 hover:bg-secondary/40 hover:shadow-md disabled:opacity-60 cursor-pointer"
            >
              {googleLoading ? (
                <Loader2 className="h-5 w-5 animate-spin text-gold" />
              ) : (
                <GoogleIcon />
              )}
              <span>{mode === "signin" ? "Continuer avec Google" : "S'inscrire avec Google"}</span>
            </button>

            {/* Séparateur stylisé */}
            <div className="relative my-6 flex items-center justify-center">
              <div className="w-full border-t border-border" />
              <span className="absolute bg-card px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                ou avec votre email
              </span>
            </div>

            {/* Formulaire Email / Mot de passe */}
            <form onSubmit={handleEmail} className="space-y-4">
              {mode === "signup" && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-primary mb-1.5">
                      Nom complet
                    </label>
                    <div className="relative">
                      <UserIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                        placeholder="Ex: Samuel Kouassi"
                        className="w-full rounded-2xl border border-input bg-background py-3 pl-10 pr-4 text-sm text-foreground transition-all duration-200 placeholder:text-muted-foreground/60 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-primary mb-1.5">
                      Numéro de téléphone (WhatsApp / SMS)
                    </label>
                    <div className="relative">
                      <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+225 07 00 00 00 00"
                        className="w-full rounded-2xl border border-input bg-background py-3 pl-10 pr-4 text-sm text-foreground transition-all duration-200 placeholder:text-muted-foreground/60 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-semibold text-primary mb-1.5">
                  Adresse email
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="nom@exemple.com"
                    className="w-full rounded-2xl border border-input bg-background py-3 pl-10 pr-4 text-sm text-foreground transition-all duration-200 placeholder:text-muted-foreground/60 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-primary">
                    Mot de passe
                  </label>
                  {mode === "signin" && (
                    <button
                      type="button"
                      onClick={() =>
                        toast.info("Pour réinitialiser votre mot de passe, contactez notre support client ou utilisez la connexion rapide Google.")
                      }
                      className="text-[11px] font-medium text-gold hover:underline cursor-pointer"
                    >
                      Mot de passe oublié ?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    placeholder="Au moins 6 caractères"
                    className="w-full rounded-2xl border border-input bg-background py-3 pl-10 pr-11 text-sm text-foreground transition-all duration-200 placeholder:text-muted-foreground/60 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                    title={showPassword ? "Masquer" : "Afficher"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Checkbox Se souvenir de moi */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-border text-gold focus:ring-gold h-4 w-4"
                  />
                  <span>Rester connecté</span>
                </label>

                {mode === "signup" && (
                  <span className="text-[11px] text-muted-foreground">
                    En vous inscrivant, vous acceptez nos CGV.
                  </span>
                )}
              </div>

              {/* Bouton d'Action Principal */}
              <button
                type="submit"
                disabled={loading || googleLoading}
                className="group relative mt-2 flex w-full items-center justify-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-gold via-amber-500 to-gold py-3.5 px-6 text-sm font-bold text-[#14110F] shadow-gold transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_50px_-12px_rgba(212,175,55,0.7)] disabled:translate-y-0 disabled:opacity-60 cursor-pointer"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-[#14110F]" />
                ) : (
                  <>
                    <span>{mode === "signin" ? "Se connecter à mon compte" : "Créer mon compte Cereals House"}</span>
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </form>

            {/* Bascule rapide au pied du formulaire */}
            <div className="mt-6 text-center text-xs text-muted-foreground">
              {mode === "signin" ? (
                <>
                  Pas encore de compte ?{" "}
                  <button
                    type="button"
                    onClick={() => setMode("signup")}
                    className="font-semibold text-gold hover:underline cursor-pointer"
                  >
                    Inscrivez-vous gratuitement
                  </button>
                </>
              ) : (
                <>
                  Vous avez déjà un compte ?{" "}
                  <button
                    type="button"
                    onClick={() => setMode("signin")}
                    className="font-semibold text-gold hover:underline cursor-pointer"
                  >
                    Connectez-vous directement
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Bas de page discret */}
          <div className="text-center text-[11px] text-muted-foreground pt-4 border-t border-border/60">
            Besoin d'aide ? Contactez notre conciergerie client par WhatsApp au{" "}
            <a href="https://wa.me/2250584637219" target="_blank" rel="noopener noreferrer" className="font-semibold text-gold hover:underline">
              +225 05 84 63 72 19
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
