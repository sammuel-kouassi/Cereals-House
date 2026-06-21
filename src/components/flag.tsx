type FlagProps = {
  code: string | null | undefined;
  className?: string;
  alt?: string;
};

/**
 * Drapeau pays via flagcdn.com (SVG), pour un rendu fiable sur Windows
 * où les emojis drapeaux ne sont pas supportés nativement.
 */
export function Flag({ code, className, alt }: FlagProps) {
  if (!code) return null;
  const cc = code.toLowerCase();
  return (
    <img
      src={`https://flagcdn.com/${cc}.svg`}
      alt={alt ?? `Drapeau ${code}`}
      className={
        className ??
        "inline-block h-4 w-6 rounded-[2px] object-cover align-[-2px] shadow-sm"
      }
      loading="lazy"
    />
  );
}
