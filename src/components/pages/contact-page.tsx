import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Phone,
  Mail,
  MapPin,
  MessageCircle,
  ArrowUpRight,
  Boxes,
  Send,
  Building2,
  Sparkles,
  Clock,
  HelpCircle,
  ChevronDown,
  CheckCircle2,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Reveal } from "@/components/reveal";
import { useLanguageNavigation } from "@/lib/i18n-routing";
import { CerealMotifBackground } from "@/components/ui/cereal-motif-background";
import { submitQuoteRequestFn } from "@/lib/admin/quotes.functions";
import { useMutation } from "@tanstack/react-query";

const WHATSAPP_NUMBER = "2250584637219";

export function ContactPage() {
  const { t } = useTranslation();
  const { getLocalizedPath } = useLanguageNavigation();
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const cardBase =
    "group relative flex h-full flex-col justify-between overflow-hidden rounded-3xl border border-border bg-card p-7 transition-all duration-300 hover:-translate-y-1 hover:border-gold/50 hover:shadow-lg";
  const topLine =
    "absolute inset-x-0 top-0 h-0.5 origin-left scale-x-0 bg-gradient-to-r from-gold via-gold/70 to-transparent transition-transform duration-500 ease-out group-hover:scale-x-100";
  const iconWrap =
    "grid h-12 w-12 place-items-center rounded-2xl bg-gold/15 text-gold border border-gold/25 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3";

  const channels = [
    {
      href: "https://wa.me/2250584637219?text=Bonjour%20Cereals%20House,%20je%20souhaite%20des%20informations.",
      icon: MessageCircle,
      title: t("contact.channels.whatsappTitle", "WhatsApp Direct"),
      hours: t("contact.channels.whatsappHours", "Réponse moyenne en moins de 15 min"),
      value: "+225 05 84 63 72 19",
      badge: t("contact.channels.whatsappBadge", "Recommandé · 7j/7"),
      external: true,
      highlight: true,
    },
    {
      href: "tel:+2250584637219",
      icon: Phone,
      title: t("contact.channels.phoneTitle", "Téléphone Client"),
      hours: t("contact.channels.phoneHours", "Du Lundi au Samedi (8h - 19h)"),
      value: "+225 05 84 63 72 19",
      badge: t("contact.channels.phoneBadge", "Appel direct"),
      external: false,
    },
    {
      href: "mailto:apiahrose8@gmail.com",
      icon: Mail,
      title: t("contact.channels.emailTitle", "Email Professionnel"),
      hours: t("contact.channels.emailHours", "Partenariats & Devis B2B"),
      value: "apiahrose8@gmail.com",
      badge: t("contact.channels.emailBadge", "Réponse sous 24h"),
      external: false,
    },
    {
      href: "#devis",
      icon: MapPin,
      title: t("contact.channels.hqTitle", "Siège & Distribution"),
      hours: t("contact.channels.hqHours", "Abidjan, Côte d'Ivoire"),
      value: t("contact.channels.hqValue", "Livraisons UEMOA & International"),
      badge: t("contact.channels.hqBadge", "Plateforme centrale"),
      external: false,
    },
  ];

  const faqs = (t("contact.faqs", { returnObjects: true }) as Array<{ q: string; a: string }>) || [
    {
      q: "Comment payer ma commande en ligne ?",
      a: "Nous acceptons tous les paiements Mobile Money (Wave, Orange Money, MTN Mobile Money, Moov Money) ainsi que les cartes Visa et Mastercard. Le règlement est 100% sécurisé et instantané.",
    },
    {
      q: "Quels sont vos délais de livraison ?",
      a: "À Abidjan et Dakar, vos colis sont livrés sous 24h à 48h. Pour les autres villes et l'international, l'acheminement prend entre 48h et 5 jours ouvrés avec suivi en temps réel.",
    },
    {
      q: "Proposez-vous des tarifs dégressifs pour les commandes en gros (B2B) ?",
      a: "Absolument. Nous fournissons restaurants, crèches, boulangeries et supermarchés en sacs de 25kg et 50kg avec des tarifs avantageux. Remplissez le formulaire de devis ci-dessous pour une offre immédiate.",
    },
    {
      q: "Comment sont conditionnées vos farines et céréales ?",
      a: "Nos céréales sont conditionnées en bocaux hermétiques et sachets barrières scellés à l'abri de la lumière et de l'humidité pour garantir une conservation optimale de 24 mois.",
    },
  ];

  const [form, setForm] = useState({
    type: "wholesale",
    name: "",
    company: "",
    phone: "",
    email: "",
    location: "",
    quantity: "",
    products: "",
    message: "",
  });

  const mutation = useMutation({
    mutationFn: () => submitQuoteRequestFn({ data: form }),
    onSuccess: () => {
      toast.success(t("contact.formSuccess", "Demande envoyée ! Notre équipe vous contactera sous 24h."));
      setForm({ ...form, name: "", company: "", phone: "", email: "", location: "", quantity: "", products: "", message: "" });
    },
    onError: (err: any) => {
      toast.error(err.message || "Une erreur est survenue lors de l'envoi.");
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim() || !form.location.trim()) {
      toast.error(t("contact.formErrorRequired", "Merci de renseigner au moins votre nom, téléphone et localisation."));
      return;
    }

    mutation.mutate();
  };

  return (
    <div className="bg-background text-foreground min-h-screen">
      {/* 1. Hero Sombre & Prestigieux */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#2D1A0E] via-[#3F2513] to-[#22130A] text-stone-100 py-16 sm:py-24 border-b border-gold/40">

        <div className="relative z-10 mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <Reveal>
            <div className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-gold backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5 text-gold animate-pulse" />
              <span>{t("contact.eyebrow", "Écoute & Proximité")}</span>
            </div>
          </Reveal>

          <Reveal delay={100}>
            <h1 className="mt-4 font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.1]">
              {t("contact.heroTitle", "Entrons en")}{" "}
              <span className="bg-gradient-to-r from-[#FDF0CD] via-[#E5BF5A] to-[#BF9024] bg-clip-text text-transparent">
                {t("contact.heroTitleGold", "Contact")}
              </span>
            </h1>
          </Reveal>

          <Reveal delay={180}>
            <p className="mt-5 text-base sm:text-lg text-stone-300 font-light leading-relaxed max-w-2xl mx-auto">
              {t("contact.heroDesc", "Une question sur nos céréales, envie de devenir distributeur ou besoin d'un devis sur-mesure ? Notre équipe vous répond 7j/7.")}
            </p>
          </Reveal>
        </div>
      </section>

      {/* 2. Cartes Canaux de Contact */}
      <section className="mx-auto max-w-7xl px-4 -mt-8 sm:-mt-10 relative z-20 sm:px-6 lg:px-8">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {channels.map((ch, idx) => (
            <Reveal key={ch.title} delay={idx * 60}>
              <a
                href={ch.href}
                target={ch.external ? "_blank" : undefined}
                rel={ch.external ? "noopener noreferrer" : undefined}
                className={cardBase}
              >
                <span className={topLine} />
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className={iconWrap}>
                      <ch.icon className="h-6 w-6" />
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full bg-secondary/80 px-2.5 py-0.5 text-[10px] font-semibold text-primary">
                      {ch.badge}
                    </span>
                  </div>
                  <h3 className="font-display text-lg font-bold text-primary transition-colors group-hover:text-gold">
                    {ch.title}
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">{ch.hours}</p>
                </div>
                <div className="mt-6 flex items-center justify-between border-t border-border/80 pt-4">
                  <span className="text-xs font-bold text-gold truncate">{ch.value}</span>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-gold" />
                </div>
              </a>
            </Reveal>
          ))}
        </div>
      </section>

      {/* 3. Formulaire de Devis Professionnel & B2B */}
      <section id="devis" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-12 items-start">
          {/* Colonne Explicative B2B */}
          <div className="lg:col-span-5 space-y-6">
            <Reveal>
              <span className="text-xs font-semibold uppercase tracking-widest text-gold inline-flex items-center gap-1.5">
                <Boxes className="h-3.5 w-3.5" /> {t("contact.b2bEyebrow", "Espace Professionnel & Vrac")}
              </span>
              <h2 className="mt-2 font-display text-3xl sm:text-4xl font-bold text-primary">
                {t("contact.b2bTitle", "Demande de Devis Grossiste / B2B")}
              </h2>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                {t("contact.b2bDesc", "Vous êtes restaurateur, crèche, revendeur ou transformateur ? Obtenez une proposition commerciale adaptée à vos volumes en moins de 24h.")}
              </p>

              {/* Avantages B2B */}
              <div className="space-y-3.5 pt-4">
                {[
                  t("contact.b2bAdvantage1", "Tarifs dégressifs dès 25kg"),
                  t("contact.b2bAdvantage2", "Traçabilité & Certificats sanitaires"),
                  t("contact.b2bAdvantage3", "Conditionnements pros renforcés"),
                  t("contact.b2bAdvantage4", "Livraison palette ou colis express"),
                ].map((adv) => (
                  <div key={adv} className="flex items-center gap-2.5 text-xs sm:text-sm font-medium text-foreground">
                    <CheckCircle2 className="h-4 w-4 text-gold shrink-0" />
                    <span>{adv}</span>
                  </div>
                ))}
              </div>

              {/* Encadré d'Assistance */}
              <div className="rounded-2xl border border-border bg-secondary/30 p-5 mt-6">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-gold/15 text-gold">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-primary">Service Commercial Réactif</h4>
                    <p className="text-[11px] text-muted-foreground">Traitement direct sous 24h ouvrées.</p>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>

          {/* Formulaire */}
          <div className="lg:col-span-7">
            <Reveal delay={100}>
              <form onSubmit={handleSubmit} className="rounded-3xl border border-border bg-card p-6 sm:p-10 shadow-lg space-y-6">
                {/* Type de demande */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                    {t("contact.formType", "Type de projet *")}
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {[
                      { id: "wholesale", label: t("contact.formTypeWholesale", "Achat en gros (25kg - 500kg+)") },
                      { id: "distributor", label: t("contact.formTypeDistributor", "Distribution & Revente locale") },
                      { id: "both", label: t("contact.formTypeBoth", "Autre projet sur-mesure") },
                    ].map((tOpt) => (
                      <button
                        key={tOpt.id}
                        type="button"
                        onClick={() => setForm({ ...form, type: tOpt.id })}
                        className={`rounded-xl border p-3 text-left text-xs font-semibold transition cursor-pointer ${
                          form.type === tOpt.id
                            ? "border-gold bg-gold/10 text-gold font-bold shadow-xs"
                            : "border-border bg-secondary/40 text-muted-foreground hover:bg-secondary hover:text-foreground"
                        }`}
                      >
                        {tOpt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1.5">
                      {t("contact.formContactName", "Votre Nom complet *")}
                    </label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="ex : Marie Koné"
                      className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-gold focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1.5">
                      {t("contact.formCompany", "Nom de l'établissement / structure")}
                    </label>
                    <input
                      type="text"
                      value={form.company}
                      onChange={(e) => setForm({ ...form, company: e.target.value })}
                      placeholder="ex : Crèche Les Petits Anges / Restaurant"
                      className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-gold focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1.5">
                      {t("contact.formPhone", "Numéro de téléphone / WhatsApp *")}
                    </label>
                    <input
                      type="tel"
                      required
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="ex : +225 07 00 00 00 00"
                      className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-gold focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1.5">
                      {t("contact.formEmail", "Adresse email professionnelle")}
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="contact@etablissement.com"
                      className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-gold focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1.5">
                      {t("contact.formLocation", "Ville et Pays de livraison *")}
                    </label>
                    <input
                      type="text"
                      required
                      value={form.location}
                      onChange={(e) => setForm({ ...form, location: e.target.value })}
                      placeholder={t("contact.formLocationPlaceholder", "ex : Abidjan, Côte d'Ivoire")}
                      className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-gold focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1.5">
                      {t("contact.formQuantity", "Volume estimé")}
                    </label>
                    <input
                      type="text"
                      value={form.quantity}
                      onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                      placeholder={t("contact.formQuantityPlaceholder", "ex : 100 kg / mois")}
                      className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-gold focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    {t("contact.formProducts", "Céréales & Farines recherchées")}
                  </label>
                  <input
                    type="text"
                    value={form.products}
                    onChange={(e) => setForm({ ...form, products: e.target.value })}
                    placeholder={t("contact.formProductsPlaceholder", "ex : Fonio, Farine Bébé Mix, Mil...")}
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-gold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    {t("contact.formMessage", "Détails complémentaires")}
                  </label>
                  <textarea
                    rows={3}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    placeholder={t("contact.formMessagePlaceholder", "Indiquez vos besoins spécifiques...")}
                    className="w-full rounded-xl border border-border bg-background p-4 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-gold focus:outline-none"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={mutation.isPending}
                    className="flex w-full items-center justify-center gap-2 rounded-full bg-gold py-3.5 text-xs sm:text-sm font-bold text-gold-foreground shadow-gold transition hover:bg-gold/90 hover:-translate-y-0.5 cursor-pointer disabled:opacity-50"
                  >
                    <Send className="h-4 w-4" />
                    <span>{mutation.isPending ? "Envoi en cours..." : t("contact.formSubmitNew", "Envoyer ma demande de devis")}</span>
                  </button>
                  <p className="mt-2 text-center text-[11px] text-muted-foreground">
                    {t("contact.formSubmitNoteNew", "Notre équipe commerciale sera notifiée immédiatement et reviendra vers vous avec une proposition.")}
                  </p>
                </div>
              </form>
            </Reveal>
          </div>
        </div>
      </section>

      {/* 4. FAQ Accordéon */}
      <section className="border-t border-border/80 bg-secondary/30 py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="text-center mb-12">
              <span className="text-xs font-semibold uppercase tracking-widest text-gold inline-flex items-center gap-1.5">
                <HelpCircle className="h-3.5 w-3.5" /> {t("contact.faqEyebrow", "Foire Aux Questions")}
              </span>
              <h2 className="mt-2 font-display text-3xl sm:text-4xl font-bold text-primary">
                {t("contact.faqTitle", "Questions fréquentes")}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {t("contact.faqDesc", "Trouvez des réponses claires sur nos commandes, livraisons et modes de paiement.")}
              </p>
            </div>
          </Reveal>

          <div className="space-y-4">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <Reveal key={faq.q} delay={idx * 50}>
                  <div className="overflow-hidden rounded-2xl border border-border bg-card transition-colors duration-200 hover:border-gold/40">
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      className="flex w-full items-center justify-between p-5 sm:p-6 text-left cursor-pointer"
                    >
                      <span className="font-display text-sm sm:text-base font-bold text-primary">
                        {faq.q}
                      </span>
                      <ChevronDown
                        className={`h-4 w-4 text-gold transition-transform duration-300 ${
                          isOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="border-t border-border/60 bg-secondary/20 p-5 sm:p-6 text-xs sm:text-sm text-muted-foreground leading-relaxed motion-safe:animate-[fade-in_0.2s_ease-out]">
                        {faq.a}
                      </div>
                    )}
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
