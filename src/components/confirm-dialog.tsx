import { AlertTriangle, X } from "lucide-react";

type Props = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
};

/**
 * Boîte de dialogue de confirmation, pour remplacer window.confirm() par
 * quelque chose de cohérent avec la charte graphique du site. Utilisée pour
 * toute action destructive/irréversible (annulation de commande, etc.).
 */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  loading,
}: Props) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm motion-safe:animate-[fade-in_0.2s_ease-out_both]"
      role="dialog"
      aria-modal="true"
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-2xl motion-safe:animate-[fade-in_0.25s_ease-out_both]"
      >
        <button
          type="button"
          onClick={onCancel}
          className="absolute right-4 top-4 text-muted-foreground transition-colors duration-200 hover:text-primary"
          aria-label={cancelLabel}
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-destructive/10 text-destructive">
          <AlertTriangle className="h-6 w-6" />
        </div>

        <h2 className="mt-4 text-center font-display text-lg font-bold text-primary">{title}</h2>
        <p className="mt-2 text-center text-sm leading-relaxed text-muted-foreground">{message}</p>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 rounded-full border border-border px-4 py-2.5 text-sm font-semibold text-foreground/80 transition-all duration-300 hover:bg-secondary disabled:opacity-60"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 rounded-full bg-destructive px-4 py-2.5 text-sm font-semibold text-destructive-foreground transition-all duration-300 hover:brightness-110 disabled:opacity-60"
          >
            {loading ? "…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}