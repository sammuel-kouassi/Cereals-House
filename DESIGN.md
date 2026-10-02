---
name: Cereals House
description: Céréales ancestrales & farines d'éveil d'Afrique de l'Ouest
colors:
  primary: "#442a1d"
  primary-foreground: "#fbf8f3"
  gold: "#c89d42"
  gold-foreground: "#2c1b11"
  background: "#fbf8f3"
  foreground: "#2c1b11"
  card: "#ffffff"
  card-foreground: "#2c1b11"
  muted: "#f3ede3"
  muted-foreground: "#7a6755"
  border: "#e7decb"
  accent: "#c89d42"
typography:
  display:
    fontFamily: "Outfit, Playfair Display, Georgia, serif"
    fontWeight: 700
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontWeight: 400
    lineHeight: 1.55
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  2xl: "48px"
---

## Overview

Cereals House incarne le renouveau gastronomique et nutritionnel des céréales d'Afrique de l'Ouest. Le langage visuel allie le respect des matières organiques (farines pures, grains dorés au soleil, calebasses et lin naturel) à la précision d'un atelier contemporain.

## Colors

- **Primary (`#442a1d`)** : Brun torréfié profond, évoquant la terre fertile et les céréales grillées à point.
- **Signature Gold (`#c89d42`)** : Or solaire des épis de mil et de fonio à maturité, utilisé pour les actions prioritaires, badges d'authenticité et accents de prestige.
- **Warm Cream (`#fbf8f3`)** : Blanc chaud texturé lin / crème, reposant pour la lecture et chaleureux.
- **Neutral Card (`#ffffff` / sombres en dark mode)** : Conteneurs nets aux bordures délicatement dorées.

## Typography

- **Titres & Display** : `Outfit` combiné à la distinction éditoriale de `Playfair Display`. Approche calibrée à `-0.02em` pour une tenue typographique ferme et élégante.
- **Corps de texte & Données** : `Plus Jakarta Sans`. Clarté suisse pour les fiches produits, valeurs nutritionnelles, récapitulatifs de commandes et factures.

## Layout

- Structure aérée avec respiration généreuse (`py-16` à `py-24`).
- Grilles asymétriques pour les fiches céréales (mise en valeur des grains bruts, du procédé de tamisage sans sable et des conseils de préparation).
- Navigation flottante type îlot ("island-pill") avec verre dépoli et reflets spéculaires.

## Elevation & Depth

- Ombres douces teintées d'ambre (`--shadow-gold`) et de brun (`--shadow-soft`).
- Absence de fausses ombres dures ou de dégradés agressifs.
- Cartes d'atelier ("card-atelier") aux coins subtilement arrondis (16–24px) avec micro-lueur au survol.

## Shapes

- Rayons de courbure organiques : `12px` pour les contrôles, `16px–24px` pour les cartes, `full` pour les pilules de navigation et boutons d'appel à l'action.
- Bords animés ("border-animated-fine") pour les bannières de promesse et garanties qualité.

## Components

- **Bouton Primaire** : Fond or chaud, texte brun foncé contrasté, micro-effet de pression `scale(0.985)`.
- **Fiches Produits** : Photographies nettes des farines et céréales, badge d'origine, sélection dynamique des pays et prix.
- **Règlement GeniusPay** : Intégration claire des logos officiels Mobile Money et cartes bancaires.

## Do's and Don'ts

### Do's
- Utiliser les vrais termes des céréales africaines : *Fonio royal précuit*, *Mil perlé sans sable*, *Farine d'éveil enrichie*.
- Garantir le contraste AA/AAA sur tous les textes et étiquettes.
- Assurer le bon fonctionnement des flux de paiement Mobile Money en un clic.

### Don'ts
- Ne pas utiliser de dégradés fluo criards.
- Ne pas ajouter de kickers ou d'eyebrows artificiels au-dessus des titres.
- Ne pas utiliser de maquettes génériques d'e-commerce sans rapport avec l'Afrique de l'Ouest.
