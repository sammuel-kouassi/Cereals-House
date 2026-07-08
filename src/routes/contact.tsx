import { createFileRoute } from "@tanstack/react-router";
import { Phone, Mail, MapPin, MessageCircle, ArrowUpRight } from "lucide-react";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Cereals House" },
      { name: "description", content: "Contactez Cereals House par WhatsApp, téléphone ou email." },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const { t } = useTranslation();

  const cardBase =
    "group relative overflow-hidden rounded-2xl border border-border bg-card p-8 transition-all duration-300 hover:-translate-y-1 hover:border-gold/50 hover:shadow-gold";

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center motion-safe:animate-[fade-in_0.6s_ease-out_both]">
        <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-gold">
          <span className="h-px w-5 bg-gold" /> {t("contact.eyebrow")} <span className="h-px w-5 bg-gold" />
        </span>
        <h1 className="mt-2 font-display text-5xl font-bold text-primary">{t("contact.title")}</h1>
        <p className="mt-3 text-muted-foreground">{t("contact.subtitle")}</p>
      </div>

      <div className="mt-12 grid gap-6 sm:grid-cols-2">
        <a
          href="https://wa.me/2250584637219"
          target="_blank"
          rel="noopener noreferrer"
          className={`${cardBase} motion-safe:animate-[fade-in_0.6s_ease-out_both]`}
          style={{ animationDelay: "0ms" }}
        >
          <span className="absolute inset-x-0 top-0 h-0.5 origin-left scale-x-0 bg-gradient-to-r from-gold via-gold/70 to-transparent transition-transform duration-500 ease-out group-hover:scale-x-100" />
          <div className="flex items-start justify-between">
            <div className="grid h-14 w-14 place-items-center rounded-full bg-gold/10 text-gold transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
              <MessageCircle className="h-7 w-7" />
            </div>
            <ArrowUpRight className="h-4 w-4 -translate-x-1 translate-y-1 text-gold opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:translate-y-0 group-hover:opacity-100" />
          </div>
          <h3 className="mt-4 font-display text-xl font-bold text-primary transition-colors duration-300 group-hover:text-gold">
            {t("contact.whatsapp")}
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">{t("contact.whatsappHours")}</p>
          <p className="mt-3 font-semibold text-gold">+225 05 84 63 72 19</p>
        </a>

        <a
          href="tel:+2250584637219"
          className={`${cardBase} motion-safe:animate-[fade-in_0.6s_ease-out_both]`}
          style={{ animationDelay: "80ms" }}
        >
          <span className="absolute inset-x-0 top-0 h-0.5 origin-left scale-x-0 bg-gradient-to-r from-gold via-gold/70 to-transparent transition-transform duration-500 ease-out group-hover:scale-x-100" />
          <div className="flex items-start justify-between">
            <div className="grid h-14 w-14 place-items-center rounded-full bg-gold/10 text-gold transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
              <Phone className="h-7 w-7" />
            </div>
            <ArrowUpRight className="h-4 w-4 -translate-x-1 translate-y-1 text-gold opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:translate-y-0 group-hover:opacity-100" />
          </div>
          <h3 className="mt-4 font-display text-xl font-bold text-primary transition-colors duration-300 group-hover:text-gold">
            {t("contact.phone")}
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">{t("contact.phoneHours")}</p>
          <p className="mt-3 font-semibold text-gold">+225 05 84 63 72 19</p>
        </a>

        <a
          href="mailto:contact@cerealshouse.com"
          className={`${cardBase} motion-safe:animate-[fade-in_0.6s_ease-out_both]`}
          style={{ animationDelay: "160ms" }}
        >
          <span className="absolute inset-x-0 top-0 h-0.5 origin-left scale-x-0 bg-gradient-to-r from-gold via-gold/70 to-transparent transition-transform duration-500 ease-out group-hover:scale-x-100" />
          <div className="flex items-start justify-between">
            <div className="grid h-14 w-14 place-items-center rounded-full bg-gold/10 text-gold transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
              <Mail className="h-7 w-7" />
            </div>
            <ArrowUpRight className="h-4 w-4 -translate-x-1 translate-y-1 text-gold opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:translate-y-0 group-hover:opacity-100" />
          </div>
          <h3 className="mt-4 font-display text-xl font-bold text-primary transition-colors duration-300 group-hover:text-gold">
            {t("contact.email")}
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">{t("contact.emailHours")}</p>
          <p className="mt-3 font-semibold text-gold">contact@cerealshouse.com</p>
        </a>

        <div
          className={`${cardBase} motion-safe:animate-[fade-in_0.6s_ease-out_both]`}
          style={{ animationDelay: "240ms" }}
        >
          <span className="absolute inset-x-0 top-0 h-0.5 origin-left scale-x-0 bg-gradient-to-r from-gold via-gold/70 to-transparent transition-transform duration-500 ease-out group-hover:scale-x-100" />
          <div className="grid h-14 w-14 place-items-center rounded-full bg-gold/10 text-gold transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
            <MapPin className="h-7 w-7" />
          </div>
          <h3 className="mt-4 font-display text-xl font-bold text-primary">{t("contact.hq")}</h3>
          <p className="mt-2 text-sm text-muted-foreground">{t("contact.hqCity")}</p>
          <p className="mt-3 font-semibold text-primary">{t("contact.hqDelivery")}</p>
        </div>
      </div>
    </div>
  );
}