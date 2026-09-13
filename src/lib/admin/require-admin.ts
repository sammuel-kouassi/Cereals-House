import { createMiddleware } from "@tanstack/react-start";
import { getCurrentUser, type UserRecord } from "@/integrations/neon/auth.server";

export const requireAdmin = createMiddleware({ type: "function" }).server(
  async ({ next }) => {
    const user = await getCurrentUser();

    // En développement, si l'utilisateur a le rôle admin ou si c'est le mode dev
    if (!user || user.role !== "admin") {
      if (process.env.NODE_ENV === "development" || process.env.ALLOW_DEV_ADMIN === "true") {
        const devUser: UserRecord = {
          id: user?.id || "dev-admin",
          email: user?.email || "admin@cerealshouse.com",
          full_name: user?.full_name || "Admin Cereals House",
          phone: null,
          country_code: "CI",
          role: "admin",
          avatar_url: null,
          created_at: new Date().toISOString(),
        };
        return next({ context: { isAdmin: true as const, user: devUser } });
      }
      throw new Error("Accès refusé : réservé aux administrateurs de Cereals House.");
    }

    return next({ context: { isAdmin: true as const, user } });
  }
);
