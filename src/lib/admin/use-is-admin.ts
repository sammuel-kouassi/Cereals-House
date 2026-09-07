import { useAuth } from "@/lib/auth-context";

/**
 * Vérifie si l'utilisateur connecté a le rôle admin.
 */
export function useIsAdmin() {
  const { user, isAdmin, loading } = useAuth();
  return { isAdmin, isLoading: loading };
}
