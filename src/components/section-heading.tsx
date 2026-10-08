import type { ReactNode } from "react";

/**
 * En-tête de section éditorial partagé : titre serif (avec une partie en italique),
 * texte d'accompagnement et action optionnelle, séparés par un filet fin.
 * Volontairement sobre : pas de pastille, pas d'icône, pas de majuscules espacées.
 */
export function SectionHeading({
  title,
  italic,
  description,
  action,
  align = "split",
  tone = "light",
  className = "",
}: {
  title: ReactNode;
  italic?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  /** "split" : titre à gauche, texte/action à droite ; "stack" : tout empilé */
  align?: "split" | "stack";
  tone?: "light" | "dark";
  className?: string;
}) {
  const dark = tone === "dark";
  return (
    <div
      className={`flex flex-col gap-4 border-b pb-6 ${
        dark ? "border-white/10" : "border-stone-200 dark:border-stone-800"
      } ${align === "split" ? "md:flex-row md:items-end md:justify-between md:gap-10" : ""} ${className}`}
    >
      <h2
        className={`max-w-2xl font-display text-[1.7rem] font-normal leading-[1.12] tracking-[-0.015em] sm:text-[2.1rem] lg:text-[2.4rem] ${
          dark ? "text-stone-50" : "text-stone-950 dark:text-stone-50"
        }`}
      >
        {title}
        {italic ? (
          <>
            {" "}
            <em className={dark ? "text-gold" : "text-amber-800 dark:text-gold"}>{italic}</em>
          </>
        ) : null}
      </h2>
      {(description || action) && (
        <div className="flex max-w-md flex-col gap-3 md:items-end md:text-right">
          {description ? (
            <p
              className={`text-sm leading-relaxed sm:text-[0.95rem] ${
                dark ? "text-stone-300" : "text-stone-600 dark:text-stone-400"
              }`}
            >
              {description}
            </p>
          ) : null}
          {action}
        </div>
      )}
    </div>
  );
}

/** Lien texte discret avec flèche, utilisé à droite des en-têtes de section. */
export function TextLink({ children }: { children: ReactNode }) {
  return (
    <span className="group inline-flex items-center gap-2 text-sm text-amber-900 underline decoration-amber-900/30 underline-offset-4 transition-colors hover:decoration-amber-900 dark:text-gold dark:decoration-gold/40">
      {children}
      <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-0.5">
        →
      </span>
    </span>
  );
}
