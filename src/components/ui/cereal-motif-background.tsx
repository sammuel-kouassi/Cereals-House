import React from "react";

type Props = {
  variant?: "hero" | "banner" | "footer" | "card";
  className?: string;
  showLargeSheaf?: boolean;
};

/**
 * Motif de céréales d'exception : Épis de blé/mil royaux et grains dorés
 * Inspiré directement du logo Cereals House (épi circulaire, grains nobles).
 * Stylé, professionnel, responsive et cohérent sur toutes les pages.
 */
export function CerealMotifBackground({
  variant = "banner",
  className = "",
  showLargeSheaf = true,
}: Props) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden select-none ${className}`}
      aria-hidden="true"
    >
      {/* 1. Lueur d'ambiance or chaud / ambré impérial (couleurs du logo) */}
      <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-gradient-to-br from-[#D4AF37]/25 via-[#C59B27]/15 to-transparent blur-3xl" />
      <div className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-gradient-to-tl from-[#E5B842]/20 via-[#B8860B]/15 to-transparent blur-3xl" />

      {/* 2. Texture répétée de semis d'épis et de grains de céréales dorés */}
      <svg
        className="absolute inset-0 h-full w-full opacity-20 sm:opacity-25 text-[#D4AF37]"
        xmlns="http://www.w3.org/2000/svg"
        width="100%"
        height="100%"
      >
        <defs>
          <pattern
            id={`cereal-pattern-${variant}`}
            width="140"
            height="140"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(15)"
          >
            {/* Épi de mil / blé stylisé principal */}
            <g transform="translate(30, 20) scale(0.65)">
              {/* Tige centrale */}
              <path
                d="M 20 80 Q 22 45 25 10"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                fill="none"
              />
              {/* Grains étagés gauche et droite */}
              <path
                d="M 23 65 C 10 60 8 48 22 55"
                fill="currentColor"
                opacity="0.9"
              />
              <path
                d="M 24 55 C 37 50 39 38 25 45"
                fill="currentColor"
                opacity="0.9"
              />
              <path
                d="M 24 45 C 12 40 10 28 23 35"
                fill="currentColor"
                opacity="0.95"
              />
              <path
                d="M 25 35 C 38 30 40 18 26 25"
                fill="currentColor"
                opacity="0.95"
              />
              <path
                d="M 25 25 C 15 20 14 10 25 16"
                fill="currentColor"
              />
              <path
                d="M 25 15 C 35 10 36 2 26 8"
                fill="currentColor"
              />
              {/* Sommet de l'épi */}
              <path
                d="M 25 10 Q 26 0 27 -6"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              {/* Barbes fines de l'épi */}
              <path d="M 12 40 Q 5 28 0 25" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.6" fill="none" />
              <path d="M 37 30 Q 45 18 50 15" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.6" fill="none" />
            </g>

            {/* Deuxième épi miniature incliné */}
            <g transform="translate(95, 80) rotate(-40) scale(0.45)">
              <path
                d="M 20 70 Q 22 35 25 10"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                fill="none"
              />
              <path d="M 23 55 C 12 50 10 40 22 47" fill="currentColor" />
              <path d="M 24 45 C 35 40 37 30 25 37" fill="currentColor" />
              <path d="M 24 35 C 14 30 12 20 23 27" fill="currentColor" />
              <path d="M 25 25 C 36 20 38 10 26 17" fill="currentColor" />
            </g>

            {/* Grains nobles dorés isolés flottants (mil, fonio, sorgho) */}
            <g transform="translate(85, 30)">
              <ellipse cx="0" cy="0" rx="4.5" ry="2.2" transform="rotate(-30)" fill="currentColor" opacity="0.85" />
              <line x1="-3" y1="0" x2="3" y2="0" stroke="#FAF2E1" strokeWidth="0.8" opacity="0.7" />
            </g>
            <g transform="translate(15, 105)">
              <ellipse cx="0" cy="0" rx="4" ry="2" transform="rotate(45)" fill="currentColor" opacity="0.75" />
            </g>
            <g transform="translate(60, 115)">
              <ellipse cx="0" cy="0" rx="3.5" ry="1.8" transform="rotate(-15)" fill="currentColor" opacity="0.8" />
            </g>
            <circle cx="115" cy="120" r="1.5" fill="currentColor" opacity="0.6" />
            <circle cx="35" cy="5" r="1.2" fill="currentColor" opacity="0.6" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#cereal-pattern-${variant})`} />
      </svg>

      {/* 3. Grand Épi d'Or Signature en filigrane royal (comme sur le logo officiel) */}
      {showLargeSheaf && (
        <div
          className={`absolute pointer-events-none transition-transform duration-700 ${
            variant === "hero"
              ? "-right-16 -bottom-24 w-[380px] sm:w-[500px] lg:w-[620px] opacity-25 lg:opacity-30"
              : variant === "footer"
              ? "-right-12 -top-20 w-[340px] sm:w-[460px] opacity-22"
              : "-right-10 -bottom-20 w-[280px] sm:w-[380px] opacity-25"
          }`}
        >
          <svg viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full text-[#D4AF37]">
            {/* Grand arc de cercle or stylisé (rappelant l'emblème circulaire du logo) */}
            <circle
              cx="200"
              cy="200"
              r="170"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeDasharray="8 6"
              opacity="0.3"
            />
            <circle
              cx="200"
              cy="200"
              r="150"
              stroke="currentColor"
              strokeWidth="1.2"
              opacity="0.2"
            />

            {/* Grande branche d'épi de blé/mil enroulée (exactement comme le logo) */}
            <g transform="translate(80, 50) rotate(-15) scale(1.6)">
              {/* Tige majestueuse */}
              <path
                d="M 50 180 C 45 120 70 60 120 20"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
                fill="none"
              />
              {/* Épis dorés majestueux qui épousent la courbure */}
              <path d="M 68 140 C 40 135 35 110 65 122" fill="currentColor" />
              <path d="M 75 122 C 100 115 105 90 75 102" fill="currentColor" />
              <path d="M 78 102 C 50 95 48 70 76 84" fill="currentColor" />
              <path d="M 86 84 C 112 77 114 55 86 68" fill="currentColor" />
              <path d="M 92 66 C 70 58 72 38 94 52" fill="currentColor" />
              <path d="M 102 50 C 125 42 126 25 103 36" fill="currentColor" />
              <path d="M 112 34 C 95 24 100 10 118 22" fill="currentColor" />
              <path d="M 120 20 C 140 14 138 2 124 10" fill="currentColor" />
              {/* Pointe éthérée */}
              <path d="M 124 10 Q 140 -2 150 -10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            </g>

            {/* Bol et grains stylisés en silhouette dorée (comme le logo) */}
            <g transform="translate(180, 270) scale(0.85)">
              <path
                d="M 10 20 C 15 50 65 50 70 20 Z"
                fill="currentColor"
                opacity="0.7"
              />
              {/* Grains qui s'élèvent */}
              <ellipse cx="25" cy="10" rx="6" ry="3" fill="currentColor" transform="rotate(-20 25 10)" />
              <ellipse cx="40" cy="5" rx="7" ry="3.5" fill="currentColor" transform="rotate(10 40 5)" />
              <ellipse cx="55" cy="12" rx="6" ry="3" fill="currentColor" transform="rotate(30 55 12)" />
              <ellipse cx="38" cy="-5" rx="5" ry="2.5" fill="currentColor" />
            </g>
          </svg>
        </div>
      )}
    </div>
  );
}
