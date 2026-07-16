import { createFileRoute } from "@tanstack/react-router";
import { Phone, Mail, MapPin, MessageCircle, ArrowUpRight, Boxes } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Reveal } from "@/components/reveal";

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
    "group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card p-8 transition-all duration-300 hover:-translate-y-1 hover:border-gold/50 hover:shadow-gold";
  const topLine =
    "absolute inset-x-0 top-0 h-0.5 origin-left scale-x-0 bg-gradient-to-r from-gold via-gold/70 to-transparent transition-transform duration-500 ease-out group-hover:scale-x-100";
  const iconWrap =
    "grid h-14 w-14 place-items-center rounded-full bg-gold/10 text-gold transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6";

  const channels = [
    {
      href: "https://wa.me/2250584637219",
      icon: MessageCircle,
      title: t("contact.whatsapp"),
      hours: t("contact.whatsappHours"),
      value: "+225 05 84 63 72 19",
      external: true,
    },
    {
      href: "tel:+2250584637219",
      icon: Phone,
      title: t("contact.phone"),
      hours: t("contact.phoneHours"),
      value: "+225 05 84 63 72 19",
      external: false,
    },
    {
      href: "apiahrose8@gmail.com",
      icon: Mail,
      title: t("contact.email"),
      hours: t("contact.emailHours"),
      value: "apiahrose8@gmail.com",
      external: false,
    },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <Reveal>
        <div className="text-center">
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-gold">
            <span className="h-px w-5 bg-gold" /> {t("contact.eyebrow")}{" "}
            <span className="h-px w-5 bg-gold" />
          </span>
          <h1 className="mt-2 font-display text-5xl font-bold text-primary">
            {t("contact.title")}
          </h1>
          <p className="mt-3 text-muted-foreground">{t("contact.subtitle")}</p>
        </div>
      </Reveal>

      <Reveal delay={60}>
        <div className="relative mt-10 overflow-hidden rounded-2xl border border-gold/30 bg-gradient-to-br from-primary to-primary/90 p-7 text-primary-foreground">
          <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-gold/10 blur-2xl" />
          <div className="relative flex items-start gap-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gold/15 text-gold">
              <Boxes className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-widest text-gold">
                {t("contact.bulkEyebrow")}
              </span>
              <h2 className="mt-1 font-display text-xl font-bold">{t("contact.bulkTitle")}</h2>
              <p className="mt-2 text-sm leading-relaxed text-primary-foreground/80">
                {t("contact.bulkDesc")}
              </p>
            </div>
          </div>
        </div>
      </Reveal>

      <div className="mt-12 grid gap-6 sm:grid-cols-2">
        {channels.map((c, idx) => (
          <Reveal key={c.title} delay={idx * 80}>
            <a
              href={c.href}
              target={c.external ? "_blank" : undefined}
              rel={c.external ? "noopener noreferrer" : undefined}
              className={cardBase}
            >
              <span className={topLine} />
              <div className="flex items-start justify-between">
                <div className={iconWrap}>
                  <c.icon className="h-7 w-7" />
                </div>
                <ArrowUpRight className="h-4 w-4 -translate-x-1 translate-y-1 text-gold opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:translate-y-0 group-hover:opacity-100" />
              </div>
              <h3 className="mt-4 font-display text-xl font-bold text-primary transition-colors duration-300 group-hover:text-gold">
                {c.title}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">{c.hours}</p>
              <p className="mt-3 font-semibold text-gold">{c.value}</p>
            </a>
          </Reveal>
        ))}

        <Reveal delay={channels.length * 80}>
          <div className={cardBase}>
            <span className={topLine} />
            <div className={iconWrap}>
              <MapPin className="h-7 w-7" />
            </div>
            <h3 className="mt-4 font-display text-xl font-bold text-primary">{t("contact.hq")}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{t("contact.hqCity")}</p>
            <p className="mt-3 font-semibold text-primary">{t("contact.hqDelivery")}</p>
          </div>
        </Reveal>
      </div>
    </div>
  );
}