// Middleware serveur pour toutes les server functions d'administration.
// S'appuie sur requireSupabaseAuth (authentification), puis vérifie le rôle
// admin via la table user_roles — table que l'utilisateur peut lire pour
// SA PROPRE ligne (policy "users_view_own_roles"), donc cette vérification
// fonctionne avec le client RLS-scopé de l'utilisateur, sans avoir besoin
// d'exécuter la fonction has_role() (dont l'EXECUTE a été retiré aux rôles
// anon/authenticated par une migration antérieure — voir les migrations SQL).
import { createMiddleware } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const requireAdmin = createMiddleware({ type: "function" })
  .middleware([requireSupabaseAuth])
  .server(async ({ next, context }) => {
    const { supabase, userId } = context;

    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();

    if (error || !data) {
      throw new Error("Accès refusé : réservé aux administrateurs.");
    }

    return next({ context: { ...context, isAdmin: true as const } });
  });
