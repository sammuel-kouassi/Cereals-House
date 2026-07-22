// Envoi d'email via l'API REST Resend — SERVEUR UNIQUEMENT.
// Volontairement sans SDK (juste fetch natif) pour rester cohérent avec le
// reste du projet et éviter une dépendance supplémentaire pour un simple
// appel POST JSON.
//
// Variables d'environnement requises (dans .env.local) :
//   RESEND_API_KEY   — clé API (commence par "re_")
//   EMAIL_FROM       — expéditeur, ex: "Cereals House <commandes@cerealshouse.com>"
//                       Tant que le domaine n'est pas vérifié sur Resend, utilise
//                       "Cereals House <onboarding@resend.dev>" — mais dans ce cas
//                       Resend n'autorise l'envoi qu'à l'adresse email du compte
//                       Resend lui-même (limite de leur mode sandbox).
//
// Toutes les fonctions appelantes doivent traiter l'échec d'envoi comme
// NON BLOQUANT : un email qui ne part pas ne doit jamais faire échouer une
// mise à jour de commande ou un paiement.
export type EmailAttachment = {
  filename: string;
  content: string; // base64
};

export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
  attachments?: EmailAttachment[];
}): Promise<{ sent: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !from) {
    console.warn(
      "[email] RESEND_API_KEY ou EMAIL_FROM manquant — email non envoyé (voir .env.local).",
    );
    return { sent: false, error: "not_configured" };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [params.to],
        subject: params.subject,
        html: params.html,
        attachments: params.attachments,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error(`[email] Échec Resend (${res.status})`, body);
      return { sent: false, error: body };
    }
    return { sent: true };
  } catch (err) {
    console.error("[email] Erreur réseau lors de l'envoi", err);
    return { sent: false, error: err instanceof Error ? err.message : "unknown" };
  }
}