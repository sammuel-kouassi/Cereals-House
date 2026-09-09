import { createFileRoute } from "@tanstack/react-router";
import { ContactPage } from "@/components/pages/contact-page";

export const Route = createFileRoute("/$lang/contact")({
  head: () => ({
    meta: [
      { title: "Contact & Devis — Cereals House" },
      { name: "description", content: "Contactez Cereals House par WhatsApp, téléphone ou demandez un devis pour commande en gros." },
    ],
  }),
  component: ContactPage,
});
