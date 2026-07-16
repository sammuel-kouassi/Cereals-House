import { Wheat } from "lucide-react";
import { useTranslation } from "react-i18next";

/**
 * Écran de chargement plein page, cohérent avec l'identité visuelle
 * (grain de blé animé + halo doré) — remplace les textes bruts "Chargement…"
 * un peu partout dans l'app.
 */
export function PageLoader({ label }: { label?: string }) {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-5 px-4 py-20 text-center">
      <div className="relative grid h-20 w-20 place-items-center">
        <span className="absolute inset-0 rounded-full bg-gold/15 motion-safe:animate-ping" />
        <span className="absolute inset-[6px] rounded-full border-2 border-gold/25" />
        <span
          className="absolute inset-[6px] rounded-full border-2 border-transparent border-t-gold motion-safe:animate-spin"
          style={{ animationDuration: "1.1s" }}
        />
        <Wheat className="h-8 w-8 text-gold motion-safe:animate-pulse" />
      </div>
      <p className="text-sm font-medium text-muted-foreground">{label ?? t("common.loading")}</p>
    </div>
  );
}
