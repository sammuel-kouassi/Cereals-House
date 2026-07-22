import { createFileRoute } from "@tanstack/react-router";
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
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Reveal } from "@/components/reveal";

const WHATSAPP_NUMBER = "2250584637219";

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
      href: "mailto:apiahrose8@gmail.com",
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

      <WholesaleForm />

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

type RequestType = "gros" | "distributeur" | "les_deux";

function WholesaleForm() {
  const { t } = useTranslation();
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined" || window.location.hash !== "#devis") return;
    const el = sectionRef.current;
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.classList.add("ring-2", "ring-gold/50");
    const timer = window.setTimeout(() => el.classList.remove("ring-2", "ring-gold/50"), 2000);
    return () => window.clearTimeout(timer);
  }, []);

  const [form, setForm] = useState({
    contactName: "",
    company: "",
    phone: "",
    email: "",
    location: "",
    requestType: "gros" as RequestType,
    products: "",
    quantity: "",
    message: "",
  });

  const requestTypeLabel: Record<RequestType, string> = {
    gros: t("contact.formTypeWholesale"),
    distributeur: t("contact.formTypeDistributor"),
    les_deux: t("contact.formTypeBoth"),
  };

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.contactName.trim() || !form.phone.trim() || !form.location.trim()) {
      toast.error(t("contact.formErrorRequired"));
      return;
    }

    const lines = [
      t("contact.formWhatsappIntro"),
      "",
      `${t("contact.formType")} : ${requestTypeLabel[form.requestType]}`,
      `${t("contact.formContactName")} : ${form.contactName}`,
      form.company ? `${t("contact.formCompany")} : ${form.company}` : null,
      `${t("contact.formPhone")} : ${form.phone}`,
      form.email ? `${t("contact.formEmail")} : ${form.email}` : null,
      `${t("contact.formLocation")} : ${form.location}`,
      form.products ? `${t("contact.formProducts")} : ${form.products}` : null,
      form.quantity ? `${t("contact.formQuantity")} : ${form.quantity}` : null,
      form.message ? `\n${form.message}` : null,
    ].filter((l): l is string => l !== null);

    const href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join("\n"))}`;
    window.open(href, "_blank", "noopener,noreferrer");
  }

  return (
    <Reveal delay={100}>
      <div
        id="devis"
        ref={sectionRef}
        className="mt-6 scroll-mt-24 rounded-2xl border border-border bg-card p-7 transition-shadow duration-500"
      >
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gold/10 text-gold">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-display text-xl font-bold text-primary">
              {t("contact.formTitle")}
            </h2>
            <p className="text-sm text-muted-foreground">{t("contact.formSubtitle")}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {t("contact.formType")}
            </span>
            <div className="mt-2 flex flex-wrap gap-2">
              {(["gros", "distributeur", "les_deux"] as RequestType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, requestType: type }))}
                  className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-all duration-300 ${
                    form.requestType === type
                      ? "border-gold bg-gold text-gold-foreground shadow-gold"
                      : "border-border bg-background text-foreground/80 hover:border-gold/40"
                  }`}
                >
                  {requestTypeLabel[type]}
                </button>
              ))}
            </div>
          </div>

          <FormField
            label={t("contact.formContactName")}
            value={form.contactName}
            onChange={(v) => setForm((p) => ({ ...p, contactName: v }))}
            required
          />
          <FormField
            label={t("contact.formCompany")}
            value={form.company}
            onChange={(v) => setForm((p) => ({ ...p, company: v }))}
          />
          <FormField
            label={t("contact.formPhone")}
            value={form.phone}
            onChange={(v) => setForm((p) => ({ ...p, phone: v }))}
            placeholder="+225 …"
            required
          />
          <FormField
            label={t("contact.formEmail")}
            value={form.email}
            onChange={(v) => setForm((p) => ({ ...p, email: v }))}
            type="email"
          />
          <FormField
            label={t("contact.formLocation")}
            value={form.location}
            onChange={(v) => setForm((p) => ({ ...p, location: v }))}
            placeholder={t("contact.formLocationPlaceholder")}
            required
          />
          <FormField
            label={t("contact.formQuantity")}
            value={form.quantity}
            onChange={(v) => setForm((p) => ({ ...p, quantity: v }))}
            placeholder={t("contact.formQuantityPlaceholder")}
          />
          <div className="sm:col-span-2">
            <FormField
              label={t("contact.formProducts")}
              value={form.products}
              onChange={(v) => setForm((p) => ({ ...p, products: v }))}
              placeholder={t("contact.formProductsPlaceholder")}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {t("contact.formMessage")}
              </span>
              <textarea
                rows={3}
                value={form.message}
                onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20"
              />
            </label>
          </div>

          <div className="sm:col-span-2">
            <button
              type="submit"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#25D366] px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:brightness-95 sm:w-auto"
            >
              <Send className="h-4 w-4" /> {t("contact.formSubmit")}
            </button>
            <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
              <MessageCircle className="h-3.5 w-3.5" /> {t("contact.formSubmitNote")}
            </p>
          </div>
        </form>
      </div>
    </Reveal>
  );
}

function FormField({
  label,
  value,
  onChange,
  placeholder,
  required,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20"
      />
    </label>
  );
}