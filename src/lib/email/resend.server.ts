// Envoi d'email via l'API REST Resend — SERVEUR UNIQUEMENT.
// Volontairement sans SDK (juste fetch natif) pour rester cohérent avec le
// reste du projet et éviter une dépendance supplémentaire pour un simple
// appel POST JSON.
//
// Expéditeur officiel certifié : "Cereals House <contact@cereals-house.com>"
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
  // Clé API et expéditeur certifié
  const apiKey = process.env.RESEND_API_KEY || "";
  let from = process.env.EMAIL_FROM;

  // Garantie absolue : si le serveur a gardé l'ancien onboarding@resend.dev en mémoire,
  // forcer immédiatement l'expéditeur vérifié officiel
  if (!from || from.includes("resend.dev")) {
    from = "Cereals House <contact@cereals-house.com>";
  }

  console.log(`[email] 📤 Envoi en cours depuis "${from}" vers "${params.to}" — Sujet: "${params.subject}"`);

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

    const bodyText = await res.text();

    if (!res.ok) {
      console.error(`[email] ❌ Échec Resend (${res.status}):`, bodyText);
      return { sent: false, error: bodyText };
    }

    console.log(`[email] ✅ Email envoyé avec succès à ${params.to} ! Réponse:`, bodyText);
    return { sent: true };
  } catch (err) {
    console.error("[email] ❌ Erreur réseau lors de l'envoi :", err);
    return { sent: false, error: err instanceof Error ? err.message : "unknown" };
  }
}