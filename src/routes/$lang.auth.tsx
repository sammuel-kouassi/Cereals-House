import { createFileRoute } from "@tanstack/react-router";
import { AuthPage } from "@/components/pages/auth-page";

export const Route = createFileRoute("/$lang/auth")({
  head: () => ({ meta: [{ title: "Connexion & Inscription | Cereals House" }] }),
  validateSearch: (s: Record<string, unknown>) => ({
    redirect: typeof s.redirect === "string" ? s.redirect : undefined,
  }),
  component: RouteComponent,
});

function RouteComponent() {
  const { redirect } = Route.useSearch();
  return <AuthPage redirectUrl={redirect} />;
}
