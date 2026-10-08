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
    fontFamily: "Times New Roman, Times, Tinos, Georgia, serif"
    fontWeight: 400
    letterSpacing: "-0.015em"
  body:
    fontFamily: "Times New Roman, Times, Tinos, Georgia, serif"
    fontWeight: 400
    lineHeight: 1.62
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

- **Police unique : Times New Roman** (repli Tinos via Google Fonts, puis Georgia). Choix de marque assumé : ton éditorial d’épicerie fine.
- **Titres** : graisse normale (400), grandes tailles, `-0.015em`. La hiérarchie vient de la taille, pas du gras. Une partie du titre peut passer en *italique* or/ambre (`<em>`) pour l’accent.
- **Étiquettes secondaires** (catégorie, public, mentions) : italique. Pas de capitales espacées.
- **Corps** : 15–17px, interlignage 1.6–1.75, mesure max ~65ch.

## Layout

- Structure aérée avec respiration généreuse (`py-16` à `py-24`).
- Grilles asymétriques pour les fiches céréales (mise en valeur des grains bruts, du procédé de tamisage sans sable et des conseils de préparation).
- Navigation flottante en pilule, fond crème quasi opaque, filet fin ; lien actif souligné d’un trait or.
- En-têtes de section : composant `SectionHeading` (titre à gauche, texte/action à droite, filet en dessous).

## Elevation & Depth

- Profondeur par filets et aplats (crème `#f6f0e6`, brun `#2c1b11`), presque jamais par l’ombre.
- Ombre uniquement pour ce qui flotte (menus, header au défilement) : décalée, douce, teintée brun.
- Pas de halos lumineux, de verre dépoli décoratif, de bordures animées ni d’éléments flottants.

## Shapes

- Rayons : `12px` cartes produits, `16px` panneaux, `full` pour boutons et petits contrôles.

## Components

- **Bouton principal** : aplat brun `#2c1b11`, texte crème (sur fond sombre : aplat or, texte brun). Pas de dégradé, pas d’agrandissement au survol.
- **Lien texte** : souligné fin, flèche → qui glisse légèrement au survol.
- **Fiches Produits** : Photographies nettes des farines et céréales, badge d'origine, sélection dynamique des pays et prix.
- **Règlement GeniusPay** : Intégration claire des logos officiels Mobile Money et cartes bancaires.

## Do's and Don'ts

### Do's
- Utiliser les vrais termes des céréales africaines : *Fonio royal précuit*, *Mil perlé sans sable*, *Farine d'éveil enrichie*.
- Garantir le contraste AA/AAA sur tous les textes et étiquettes.
- Assurer le bon fonctionnement des flux de paiement Mobile Money en un clic.

### Don'ts
- Ne pas utiliser de dégradés fluo criards.
- Ne pas ajouter de kickers ou d'eyebrows (pastilles) au-dessus des titres.
- Pas de texte en dégradé, d’emoji en guise d’icône, de faux indicateurs « en direct » qui clignotent, ni de notes/étoiles non issues d’avis réels.
- Ne pas utiliser de maquettes génériques d'e-commerce sans rapport avec l'Afrique de l'Ouest.
