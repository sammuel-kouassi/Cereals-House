import { useTranslation } from "react-i18next";

/**
 * Écran de chargement plein page : un seul indicateur fin, sans halo ni
 * pulsation (un retour sobre, cohérent avec l'identité visuelle).
 */
export function PageLoader({ label }: { label?: string }) {
  const { t } = useTranslation();
  return (
    <div
      role="status"
      className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4 py-20 text-center"
    >
      <span
        aria-hidden="true"
        className="h-7 w-7 rounded-full border-2 border-stone-200 border-t-amber-800 motion-safe:animate-spin dark:border-stone-800 dark:border-t-gold"
        style={{ animationDuration: "0.9s" }}
      />
      <p className="text-sm italic text-muted-foreground">{label ?? t("common.loading")}</p>
    </div>
  );
}
