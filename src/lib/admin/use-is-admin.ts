import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

/**
 * Vérifie si l'utilisateur connecté a le rôle admin — utilisé uniquement pour
 * afficher/masquer le lien "Admin" et rediriger hors des pages /admin côté
 * client. La vraie frontière de sécurité est le middleware requireAdmin côté
 * serveur (voir src/lib/admin/require-admin.ts) : cette vérification client
 * ne protège rien à elle seule.
 */
export function useIsAdmin() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["is-admin", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user!.id)
        .eq("role", "admin")
        .maybeSingle();
      if (error) return false;
      return !!data;
    },
  });

  return { isAdmin: !!data, isLoading: !!user && isLoading };
}
