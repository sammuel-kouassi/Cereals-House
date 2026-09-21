export interface DeliveryLocationInfo {
  id?: string;
  name: string;
  address: string;
  coords: [number, number];
  distanceKm: number;
  deliveryTime: string;
  deliveryFee: string;
  shippingType: string;
  isHub?: boolean;
}

// Hubs officiels de distribution en Afrique de l'Ouest
export const OFFICIAL_HUBS: DeliveryLocationInfo[] = [
  {
    id: "abidjan",
    name: "Abidjan (Siège Central)",
    address: "Zone Industrielle de Vridi / Cocody, Abidjan, Côte d'Ivoire",
    coords: [5.36, -4.0083],
    distanceKm: 0,
    deliveryTime: "Sous 2h à 4h chrono",
    deliveryFee: "1 500 FCFA (Offert dès 25 000 F)",
    shippingType: "Meunerie Centrale & Coursier Dédié",
    isHub: true,
  },
  {
    id: "dakar",
    name: "Dakar (Sénégal)",
    address: "Plateau & Almadies, Dakar, Sénégal",
    coords: [14.7167, -17.4677],
    distanceKm: 1820,
    deliveryTime: "24h - 48h express",
    deliveryFee: "4 500 FCFA",
    shippingType: "Hub Terroirs & Thiakry",
    isHub: true,
  },
  {
    id: "bamako",
    name: "Bamako (Mali)",
    address: "ACI 2000 & Badalabougou, Bamako, Mali",
    coords: [12.6392, -8.0029],
    distanceKm: 920,
    deliveryTime: "24h - 48h express",
    deliveryFee: "4 500 FCFA",
    shippingType: "Hub Mil Perlé & Fonio Sahel",
    isHub: true,
  },
  {
    id: "ouaga",
    name: "Ouagadougou (Burkina Faso)",
    address: "Ouaga 2000, Ouagadougou, Burkina Faso",
    coords: [12.3714, -1.5197],
    distanceKm: 830,
    deliveryTime: "24h - 48h express",
    deliveryFee: "4 500 FCFA",
    shippingType: "Hub Sorgho & Céréales Sèches",
    isHub: true,
  },
  {
    id: "lome",
    name: "Lomé (Togo)",
    address: "Déckon & Port Autonome, Lomé, Togo",
    coords: [6.1375, 1.2123],
    distanceKm: 580,
    deliveryTime: "24h - 48h",
    deliveryFee: "4 500 FCFA",
    shippingType: "Hub Distribution Côtière",
    isHub: true,
  },
  {
    id: "cotonou",
    name: "Cotonou (Bénin)",
    address: "Haie Vive & Ganhi, Cotonou, Bénin",
    coords: [6.3703, 2.4222],
    distanceKm: 710,
    deliveryTime: "24h - 48h",
    deliveryFee: "4 500 FCFA",
    shippingType: "Hub Relais & Grossistes",
    isHub: true,
  },
];

export const PRESET_DESTINATIONS = [
  {
    id: "cocody",
    label: "Abidjan - Cocody",
    name: "Cocody, Abidjan",
    address: "Cocody Ambassades / Riviera, Abidjan, Côte d'Ivoire",
    coords: [5.3574, -3.9949] as [number, number],
  },
  {
    id: "yopougon",
    label: "Abidjan - Yopougon",
    name: "Yopougon, Abidjan",
    address: "Yopougon Maroc / Niangon, Abidjan, Côte d'Ivoire",
    coords: [5.3452, -4.0781] as [number, number],
  },
  {
    id: "dakar",
    label: "Dakar (Sénégal)",
    name: "Dakar, Sénégal",
    address: "Plateau / Almadies, Dakar, Sénégal",
    coords: [14.7167, -17.4677] as [number, number],
  },
  {
    id: "bamako",
    label: "Bamako (Mali)",
    name: "Bamako, Mali",
    address: "Badalabougou / ACI 2000, Bamako, Mali",
    coords: [12.6392, -8.0029] as [number, number],
  },
  {
    id: "ouaga",
    label: "Ouaga (Burkina)",
    name: "Ouagadougou, Burkina Faso",
    address: "Ouaga 2000, Ouagadougou, Burkina Faso",
    coords: [12.3714, -1.5197] as [number, number],
  },
  {
    id: "cotonou",
    label: "Cotonou (Bénin)",
    name: "Cotonou, Bénin",
    address: "Haie Vive / Ganhi, Cotonou, Bénin",
    coords: [6.3703, 2.4222] as [number, number],
  },
  {
    id: "lome",
    label: "Lomé (Togo)",
    name: "Lomé, Togo",
    address: "Nyékonakpoé / Déckon, Lomé, Togo",
    coords: [6.1375, 1.2123] as [number, number],
  },
  {
    id: "paris",
    label: "Paris / Diaspora",
    name: "Paris, France",
    address: "Île-de-France, France (Diaspora Européenne)",
    coords: [48.8566, 2.3522] as [number, number],
  },
];

// Calcul de distance grand cercle (Haversine)
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Rayon terrestre en km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

// Calcul dynamique des frais et délais selon la distance depuis la Meunerie Centrale d'Abidjan
export function computeDeliveryInfo(
  name: string,
  address: string,
  coords: [number, number],
  isHub = false
): DeliveryLocationInfo {
  const distance = calculateDistanceKm(5.36, -4.0083, coords[0], coords[1]);

  if (distance <= 35) {
    return {
      name,
      address,
      coords,
      distanceKm: distance,
      deliveryTime: "Sous 2h à 4h chrono",
      deliveryFee: "1 500 FCFA (Offert dès 25 000 F)",
      shippingType: "Coursier direct Cereals House",
      isHub,
    };
  } else if (distance <= 650) {
    return {
      name,
      address,
      coords,
      distanceKm: distance,
      deliveryTime: "24h chrono (J+1)",
      deliveryFee: "2 500 FCFA",
      shippingType: "Liaison express interurbaine",
      isHub,
    };
  } else if (distance <= 2800) {
    return {
      name,
      address,
      coords,
      distanceKm: distance,
      deliveryTime: "24h à 48h ouvrées",
      deliveryFee: "4 500 FCFA",
      shippingType: "Fret sécurisé Hub CEDEAO",
      isHub,
    };
  } else {
    return {
      name,
      address,
      coords,
      distanceKm: distance,
      deliveryTime: "3 à 5 jours ouvrés",
      deliveryFee: "Dès 12 500 FCFA (tarif export)",
      shippingType: "Fret aérien express (DHL / Colissimo)",
      isHub,
    };
  }
}
