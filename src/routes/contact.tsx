import { createFileRoute } from "@tanstack/react-router";
import { Phone, Mail, MapPin, MessageCircle } from "lucide-react";

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
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center">
        <span className="text-xs font-semibold uppercase tracking-widest text-gold">Contact</span>
        <h1 className="mt-2 font-display text-5xl font-bold text-primary">Nous parler</h1>
        <p className="mt-3 text-muted-foreground">Notre équipe est à votre écoute pour toute question ou commande spéciale.</p>
      </div>

      <div className="mt-12 grid gap-6 sm:grid-cols-2">
        <a
          href="https://wa.me/2250584637219"
          target="_blank"
          rel="noopener noreferrer"
          className="group rounded-2xl border border-border bg-card p-8 transition hover:border-gold/50 hover:shadow-gold"
        >
          <MessageCircle className="h-8 w-8 text-gold" />
          <h3 className="mt-4 font-display text-xl font-bold text-primary">WhatsApp</h3>
          <p className="mt-2 text-sm text-muted-foreground">Réponse rapide, 7j/7</p>
          <p className="mt-3 font-semibold text-gold">+225 05 84 63 72 19</p>
        </a>

        <a href="tel:+2250584637219" className="group rounded-2xl border border-border bg-card p-8 transition hover:border-gold/50 hover:shadow-gold">
          <Phone className="h-8 w-8 text-gold" />
          <h3 className="mt-4 font-display text-xl font-bold text-primary">Téléphone</h3>
          <p className="mt-2 text-sm text-muted-foreground">Lun-Sam, 8h-19h</p>
          <p className="mt-3 font-semibold text-gold">+225 05 84 63 72 19</p>
        </a>

        <a href="mailto:contact@cerealshouse.com" className="group rounded-2xl border border-border bg-card p-8 transition hover:border-gold/50 hover:shadow-gold">
          <Mail className="h-8 w-8 text-gold" />
          <h3 className="mt-4 font-display text-xl font-bold text-primary">Email</h3>
          <p className="mt-2 text-sm text-muted-foreground">Réponse sous 24h</p>
          <p className="mt-3 font-semibold text-gold">contact@cerealshouse.com</p>
        </a>

        <div className="rounded-2xl border border-border bg-card p-8">
          <MapPin className="h-8 w-8 text-gold" />
          <h3 className="mt-4 font-display text-xl font-bold text-primary">Notre siège</h3>
          <p className="mt-2 text-sm text-muted-foreground">Abidjan, Côte d'Ivoire</p>
          <p className="mt-3 font-semibold text-primary">Livraison dans 8 pays</p>
        </div>
      </div>
    </div>
  );
}
