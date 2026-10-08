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
  CheckCircle2, Check } from "lucide-react";
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
    "group flex h-full flex-col justify-between border-t border-stone-900/80 pt-5 transition-colors duration-300 dark:border-stone-300/60";
  const topLine =
    "hidden";
  const iconWrap =
    "text-amber-800 dark:text-gold";

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
      href: "mailto:contact@cereals-house.com",
      icon: Mail,
      title: t("contact.channels.emailTitle", "Email Professionnel"),
      hours: t("contact.channels.emailHours", "Partenariats & Devis B2B"),
      value: "contact@cereals-house.com",
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
      a: "Oui. Dès 20 paquets, restaurants, crèches, boulangeries et revendeurs bénéficient de nos tarifs professionnels. Des conditionnements en vrac sont disponibles sur demande : remplissez le formulaire de devis ci-dessous.",
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
      <section className="bg-[#1a110b] py-20 text-stone-100 sm:py-24">

        <div className="relative z-10 mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <Reveal delay={100}>
            <h1 className="font-display text-[2.3rem] font-normal leading-[1.08] tracking-[-0.015em] text-stone-50 sm:text-5xl">
              {t("contact.heroTitle", "Nous sommes là pour")}{" "}
              <em className="text-gold">{t("contact.heroTitleGold", "vous aider")}</em>
            </h1>
          </Reveal>

          <Reveal delay={180}>
            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-stone-300">
              {t(
                "contact.heroDesc",
                "Une question sur la préparation de nos farines, un conseil pour votre tout-petit ou un besoin en gros pour votre restaurant ? Notre équipe vous répond avec le sourire.",
              )}
            </p>
          </Reveal>
        </div>
      </section>

      {/* 2. Cartes Canaux de Contact */}
      <section className="mx-auto max-w-7xl px-4 pt-16 sm:px-6 lg:px-8">
        <div className="grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
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
                      <ch.icon className="h-5 w-5" strokeWidth={1.5} />
                    </div>
                    <span className="text-xs italic text-stone-500">
                      {ch.badge}
                    </span>
                  </div>
                  <h3 className="font-display text-xl text-stone-950 dark:text-stone-50">
                    {ch.title}
                  </h3>
                  <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">{ch.hours}</p>
                </div>
                <div className="mt-5 flex items-center justify-between gap-3">
                  <span className="truncate text-sm text-amber-900 underline decoration-amber-900/30 underline-offset-4 group-hover:decoration-amber-900 dark:text-gold">{ch.value}</span>
                  <ArrowUpRight className="h-4 w-4 shrink-0 text-stone-400 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
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
              <h2 className="font-display text-[1.9rem] font-normal leading-[1.12] text-stone-950 dark:text-stone-50 sm:text-[2.4rem]">
                {t("contact.b2bTitle", "Demande de Devis Grossiste / B2B")}
              </h2>
              <p className="mt-4 text-[0.95rem] leading-relaxed text-stone-600 dark:text-stone-400">
                {t("contact.b2bDesc", "Vous êtes restaurateur, crèche, revendeur ou transformateur ? Obtenez une proposition commerciale adaptée à vos volumes en moins de 24h.")}
              </p>

              {/* Avantages B2B */}
              <div className="space-y-3.5 pt-4">
                {[
                  t("contact.b2bAdvantage1", "Tarifs professionnels dès 20 paquets"),
                  t("contact.b2bAdvantage2", "Qualité et traçabilité des produits"),
                  t("contact.b2bAdvantage3", "Conditionnements pros renforcés"),
                  t("contact.b2bAdvantage4", "Livraison palette ou colis"),
                ].map((adv) => (
                  <div key={adv} className="flex items-center gap-2.5 text-sm text-stone-800 dark:text-stone-200">
                    <Check className="h-4 w-4 shrink-0 text-amber-800 dark:text-gold" />
                    <span>{adv}</span>
                  </div>
                ))}
              </div>

              {/* Encadré d'Assistance */}
              <p className="mt-6 flex items-center gap-2 border-t border-stone-200 pt-5 text-sm italic text-stone-500 dark:border-stone-800">
                <Clock className="h-4 w-4" strokeWidth={1.5} />
                Service commercial : traitement sous 24h ouvrées.
              </p>
            </Reveal>
          </div>

          {/* Formulaire */}
          <div className="lg:col-span-7">
            <Reveal delay={100}>
              <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-stone-200 bg-card p-6 dark:border-stone-800 sm:p-10">
                {/* Type de demande */}
                <div>
                  <label className="mb-2 block text-sm text-stone-800 dark:text-stone-200">
                    {t("contact.formType", "Type de projet *")}
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {[
                      { id: "wholesale", label: t("contact.formTypeWholesale", "Achat en gros (dès 20 paquets)") },
                      { id: "distributor", label: t("contact.formTypeDistributor", "Distribution & Revente locale") },
                      { id: "both", label: t("contact.formTypeBoth", "Autre projet sur-mesure") },
                    ].map((tOpt) => (
                      <button
                        key={tOpt.id}
                        type="button"
                        onClick={() => setForm({ ...form, type: tOpt.id })}
                        className={`rounded-lg border p-3 text-left text-sm transition-colors cursor-pointer ${
                          form.type === tOpt.id
                            ? "border-[#2c1b11] bg-[#2c1b11] text-stone-50 dark:border-gold dark:bg-gold dark:text-stone-950"
                            : "border-stone-300 text-stone-700 hover:border-stone-500 dark:border-stone-700 dark:text-stone-300"
                        }`}
                      >
                        {tOpt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm text-stone-800 dark:text-stone-200">
                      {t("contact.formContactName", "Votre Nom complet *")}
                    </label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="ex : Marie Koné"
                      className="w-full rounded-lg border border-stone-300 bg-background px-4 py-3 text-base text-foreground placeholder:text-stone-400 transition-colors focus:border-stone-700 focus:outline-none dark:border-stone-700 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm text-stone-800 dark:text-stone-200">
                      {t("contact.formCompany", "Nom de l'établissement / structure")}
                    </label>
                    <input
                      type="text"
                      value={form.company}
                      onChange={(e) => setForm({ ...form, company: e.target.value })}
                      placeholder="ex : Crèche Les Petits Anges / Restaurant"
                      className="w-full rounded-lg border border-stone-300 bg-background px-4 py-3 text-base text-foreground placeholder:text-stone-400 transition-colors focus:border-stone-700 focus:outline-none dark:border-stone-700 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm text-stone-800 dark:text-stone-200">
                      {t("contact.formPhone", "Numéro de téléphone / WhatsApp *")}
                    </label>
                    <input
                      type="tel"
                      required
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="ex : +225 07 00 00 00 00"
                      className="w-full rounded-lg border border-stone-300 bg-background px-4 py-3 text-base text-foreground placeholder:text-stone-400 transition-colors focus:border-stone-700 focus:outline-none dark:border-stone-700 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm text-stone-800 dark:text-stone-200">
                      {t("contact.formEmail", "Adresse email professionnelle")}
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="contact@etablissement.com"
                      className="w-full rounded-lg border border-stone-300 bg-background px-4 py-3 text-base text-foreground placeholder:text-stone-400 transition-colors focus:border-stone-700 focus:outline-none dark:border-stone-700 sm:text-sm"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm text-stone-800 dark:text-stone-200">
                      {t("contact.formLocation", "Ville et Pays de livraison *")}
                    </label>
                    <input
                      type="text"
                      required
                      value={form.location}
                      onChange={(e) => setForm({ ...form, location: e.target.value })}
                      placeholder={t("contact.formLocationPlaceholder", "ex : Abidjan, Côte d'Ivoire")}
                      className="w-full rounded-lg border border-stone-300 bg-background px-4 py-3 text-base text-foreground placeholder:text-stone-400 transition-colors focus:border-stone-700 focus:outline-none dark:border-stone-700 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm text-stone-800 dark:text-stone-200">
                      {t("contact.formQuantity", "Volume estimé")}
                    </label>
                    <input
                      type="text"
                      value={form.quantity}
                      onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                      placeholder={t("contact.formQuantityPlaceholder", "ex : 100 kg / mois")}
                      className="w-full rounded-lg border border-stone-300 bg-background px-4 py-3 text-base text-foreground placeholder:text-stone-400 transition-colors focus:border-stone-700 focus:outline-none dark:border-stone-700 sm:text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm text-stone-800 dark:text-stone-200">
                    {t("contact.formProducts", "Céréales & Farines recherchées")}
                  </label>
                  <input
                    type="text"
                    value={form.products}
                    onChange={(e) => setForm({ ...form, products: e.target.value })}
                    placeholder={t("contact.formProductsPlaceholder", "ex : Fonio, Farine Bébé Mix, Mil...")}
                    className="w-full rounded-lg border border-stone-300 bg-background px-4 py-3 text-base text-foreground placeholder:text-stone-400 transition-colors focus:border-stone-700 focus:outline-none dark:border-stone-700 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm text-stone-800 dark:text-stone-200">
                    {t("contact.formMessage", "Détails complémentaires")}
                  </label>
                  <textarea
                    rows={3}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    placeholder={t("contact.formMessagePlaceholder", "Indiquez vos besoins spécifiques...")}
                    className="w-full rounded-lg border border-stone-300 bg-background p-4 text-base text-foreground placeholder:text-stone-400 transition-colors focus:border-stone-700 focus:outline-none dark:border-stone-700 sm:text-sm"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={mutation.isPending}
                    className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-[#2c1b11] py-3.5 text-sm text-stone-50 transition-colors hover:bg-[#442a1d] disabled:opacity-50 dark:bg-gold dark:text-stone-950"
                  >
                    <Send className="h-4 w-4" />
                    <span>{mutation.isPending ? "Envoi en cours..." : t("contact.formSubmitNew", "Envoyer ma demande de devis")}</span>
                  </button>
                  <p className="mt-3 text-center text-xs text-stone-500">
                    {t("contact.formSubmitNoteNew", "Notre équipe commerciale sera notifiée immédiatement et reviendra vers vous avec une proposition.")}
                  </p>
                </div>
              </form>
            </Reveal>
          </div>
        </div>
      </section>

      {/* 4. FAQ Accordéon */}
      <section className="border-t border-stone-200 bg-[#f6f0e6] py-20 dark:border-stone-800 dark:bg-stone-900/40">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="mb-10">
              <h2 className="font-display text-[1.9rem] font-normal leading-tight text-stone-950 dark:text-stone-50 sm:text-[2.4rem]">
                {t("contact.faqTitle", "Questions fréquentes")}
              </h2>
              <p className="mt-3 text-[0.95rem] text-stone-600 dark:text-stone-400">
                {t("contact.faqDesc", "Trouvez des réponses claires sur nos commandes, livraisons et modes de paiement.")}
              </p>
            </div>
          </Reveal>

          <div className="border-t border-stone-300 dark:border-stone-700">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <Reveal key={faq.q} delay={idx * 50}>
                  <div className="border-b border-stone-300 dark:border-stone-700">
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      className="flex w-full cursor-pointer items-center justify-between gap-4 py-5 text-left"
                      aria-expanded={isOpen}
                    >
                      <span className="font-display text-lg text-stone-950 dark:text-stone-50">
                        {faq.q}
                      </span>
                      <ChevronDown
                        className={`h-4 w-4 shrink-0 text-stone-500 transition-transform duration-300 ${
                          isOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="max-w-prose pb-6 text-[0.95rem] leading-relaxed text-stone-600 dark:text-stone-400 motion-safe:animate-[fade-in_0.2s_ease-out]">
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
