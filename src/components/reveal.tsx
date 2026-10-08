import { useEffect, useRef, useState, type ReactNode } from "react";

type Direction = "up" | "left" | "right" | "none";

const OFFSET: Record<Direction, string> = {
  up: "translate-y-6",
  left: "-translate-x-6",
  right: "translate-x-6",
  none: "",
};

/**
 * Anime son contenu en fondu/translation dès qu'il entre dans le viewport (une seule fois).
 * Composant partagé pour garantir la même signature d'animation sur toutes les pages
 * (accueil, panier, boutique, fiche produit, à propos, contact, commandes…).
 * Purement décoratif — respecte prefers-reduced-motion via les classes motion-safe/motion-reduce.
 */
export function Reveal({
  children,
  delay = 0,
  direction = "up",
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  direction?: Direction;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Seuil à 0 + marge basse : se déclenche dès que l'élément entre réellement
    // dans l'écran, même s'il est plus haut que le viewport (cartes longues sur mobile).
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: visible ? `${delay}ms` : "0ms" }}
      className={`transition-[opacity,translate,transform] duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none ${
        visible ? "translate-x-0 translate-y-0 opacity-100" : `${OFFSET[direction]} opacity-0`
      } ${className}`}
    >
      {children}
    </div>
  );
}
