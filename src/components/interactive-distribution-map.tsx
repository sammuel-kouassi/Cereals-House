import { useEffect, useRef, useState } from "react";
import { useLanguageNavigation } from "@/lib/i18n-routing";
import { Link } from "@tanstack/react-router";
import { MapPin, Navigation, PackageCheck, Clock, Layers, Sparkles } from "lucide-react";

interface Hub {
  id: string;
  name: string;
  country: string;
  coords: [number, number];
  role: string;
  deliveryTime: string;
  isMain?: boolean;
}

const HUBS: Hub[] = [
  {
    id: "abidjan",
    name: "Abidjan",
    country: "Côte d'Ivoire (CI)",
    coords: [5.36, -4.0083],
    role: "Siège & Meunerie Centrale",
    deliveryTime: "24h chrono",
    isMain: true,
  },
  {
    id: "dakar",
    name: "Dakar",
    country: "Sénégal (SN)",
    coords: [14.7167, -17.4677],
    role: "Hub Terroirs & Thiakry",
    deliveryTime: "24h - 48h",
  },
  {
    id: "bamako",
    name: "Bamako",
    country: "Mali (ML)",
    coords: [12.6392, -8.0029],
    role: "Mil Perlé & Fonio Sahel",
    deliveryTime: "48h",
  },
  {
    id: "ouaga",
    name: "Ouagadougou",
    country: "Burkina Faso (BF)",
    coords: [12.3714, -1.5197],
    role: "Sorgho & Céréales Sèches",
    deliveryTime: "48h",
  },
  {
    id: "lome",
    name: "Lomé",
    country: "Togo (TG)",
    coords: [6.1375, 1.2123],
    role: "Distribution Côtière",
    deliveryTime: "24h - 48h",
  },
  {
    id: "cotonou",
    name: "Cotonou",
    country: "Bénin (BJ)",
    coords: [6.3703, 2.4222],
    role: "Point Relais & Grossistes",
    deliveryTime: "24h - 48h",
  },
];

// Calcule un point sur la courbe de Bézier quadratique entre start et end à la position t (0 <= t <= 1)
function getBezierPoint(
  start: [number, number],
  end: [number, number],
  t: number
): [number, number] {
  const [lat1, lon1] = start;
  const [lat2, lon2] = end;

  // Courbure douce vers le nord/nord-est
  const midLat = (lat1 + lat2) / 2 + Math.abs(lon2 - lon1) * 0.18;
  const midLon = (lon1 + lon2) / 2;

  const lat = (1 - t) * (1 - t) * lat1 + 2 * (1 - t) * t * midLat + t * t * lat2;
  const lon = (1 - t) * (1 - t) * lon1 + 2 * (1 - t) * t * midLon + t * t * lon2;
  return [lat, lon];
}

// Génère la liste des points de la trajectoire pour le tracé de la polyligne
function getArcPoints(start: [number, number], end: [number, number], numPoints = 40): [number, number][] {
  const points: [number, number][] = [];
  for (let i = 0; i <= numPoints; i++) {
    points.push(getBezierPoint(start, end, i / numPoints));
  }
  return points;
}

export function InteractiveDistributionMap({ isActive = true }: { isActive?: boolean }) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);
  const animFrameRef = useRef<number | null>(null);
  const pulseMarkersRef = useRef<any[]>([]);

  const [selectedHub, setSelectedHub] = useState<Hub>(HUBS[0]);
  const [mapStyle, setMapStyle] = useState<"streets" | "satellite">("streets");
  const { getLocalizedPath } = useLanguageNavigation();

  useEffect(() => {
    let isMounted = true;

    async function initLeafletMap() {
      if (typeof window === "undefined" || !mapContainerRef.current) return;
      if (mapInstanceRef.current) return;

      const L = (await import("leaflet")).default;

      if (!isMounted || !mapContainerRef.current) return;

      // Carte centrée sur l'Afrique de l'Ouest avec un zoom équilibré
      const map = L.map(mapContainerRef.current, {
        center: [9.8, -4.5],
        zoom: 5.2,
        minZoom: 4,
        maxZoom: 10,
        scrollWheelZoom: false,
        doubleClickZoom: true,
        touchZoom: true,
        dragging: true,
        zoomControl: false,
        attributionControl: false,
      });

      mapInstanceRef.current = map;

      // Tuiles cartographiques claires et nettes (sans filigrane ni clé requise)
      const tileUrl =
        mapStyle === "satellite"
          ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

      const tileLayer = L.tileLayer(tileUrl, {
        subdomains: mapStyle === "satellite" ? [] : ["a", "b", "c"],
        maxZoom: 18,
      }).addTo(map);

      tileLayerRef.current = tileLayer;

      // Contrôle de zoom discret en haut à droite
      L.control.zoom({ position: "topright" }).addTo(map);

      const abidjan = HUBS[0];
      const destinationHubs = HUBS.slice(1);

      // 1. Tracé des arcs logistiques avec effet de flux dynamique continu
      destinationHubs.forEach((hub) => {
        const arc = getArcPoints(abidjan.coords, hub.coords);

        // Ligne de lueur d'ambiance dorée
        L.polyline(arc, {
          color: "#F59E0B",
          weight: 4,
          opacity: 0.3,
          lineCap: "round",
        }).addTo(map);

        // Ligne pointillée animée simulant le sens d'expédition (Abidjan -> destination)
        L.polyline(arc, {
          className: "leaflet-flow-path",
          color: "#D97706",
          weight: 2.4,
          opacity: 0.95,
          lineCap: "round",
        }).addTo(map);
      });

      // 2. Particules d'énergie mobiles voyageant d'Abidjan vers chaque pays
      const movingParticles: {
        marker: any;
        start: [number, number];
        end: [number, number];
        progress: number;
        speed: number;
      }[] = [];

      destinationHubs.forEach((hub) => {
        // Deux flux échelonnés par destination pour un mouvement continu
        [0, 0.5].forEach((offset) => {
          const packetIcon = L.divIcon({
            className: "leaflet-packet-marker",
            html: `
              <div class="relative flex items-center justify-center pointer-events-none">
                <span class="absolute h-4 w-4 rounded-full bg-amber-400/40 animate-ping"></span>
                <span class="h-2.5 w-2.5 rounded-full bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 border border-white shadow-[0_0_10px_#F59E0B]"></span>
              </div>
            `,
            iconSize: [16, 16],
            iconAnchor: [8, 8],
          });

          const initialPt = getBezierPoint(abidjan.coords, hub.coords, offset);
          const particleMarker = L.marker(initialPt, {
            icon: packetIcon,
            interactive: false,
          }).addTo(map);

          movingParticles.push({
            marker: particleMarker,
            start: abidjan.coords,
            end: hub.coords,
            progress: offset,
            speed: 0.0075 + Math.random() * 0.003, // Vitesse naturelle légèrement variée
          });
        });
      });

      pulseMarkersRef.current = movingParticles;

      // Boucle d'animation fluide 60fps pour déplacer les particules
      function animateFlow() {
        if (!isMounted) return;

        movingParticles.forEach((p) => {
          p.progress += p.speed;
          if (p.progress >= 1) {
            p.progress = 0;
          }
          const pt = getBezierPoint(p.start, p.end, p.progress);
          p.marker.setLatLng(pt);
        });

        animFrameRef.current = requestAnimationFrame(animateFlow);
      }

      animFrameRef.current = requestAnimationFrame(animateFlow);

      // 3. Marqueurs interactifs stylisés pour chaque ville
      HUBS.forEach((hub) => {
        const isCentral = hub.isMain;
        const iconHtml = `
          <div class="relative flex items-center justify-center cursor-pointer group">
            <span class="absolute -inset-2 rounded-full ${
              isCentral ? "bg-amber-400/50 animate-radar-ring" : "bg-amber-400/30 animate-ping"
            }"></span>
            <span class="relative flex ${
              isCentral ? "h-6 w-6" : "h-4 w-4"
            } items-center justify-center rounded-full bg-gradient-to-br from-amber-300 via-amber-400 to-amber-600 border-2 border-white shadow-[0_0_15px_rgba(212,175,55,0.9)] transition-transform duration-300 group-hover:scale-125">
              <span class="${isCentral ? "h-2 w-2" : "h-1.5 w-1.5"} rounded-full bg-stone-950"></span>
            </span>
            <span class="absolute top-7 whitespace-nowrap text-[10.5px] font-bold tracking-tight ${
              isCentral
                ? "text-amber-300 bg-stone-950/80 border-amber-400/50"
                : "text-stone-900 bg-white/90 border-stone-300"
            } backdrop-blur-md px-2.5 py-0.5 rounded-full border shadow-md pointer-events-none transition-transform duration-200 group-hover:scale-110">
              ${hub.name} ${isCentral ? "★" : ""}
            </span>
          </div>
        `;

        const customIcon = L.divIcon({
          html: iconHtml,
          className: "custom-hub-marker",
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });

        const marker = L.marker(hub.coords, { icon: customIcon }).addTo(map);
        marker.on("click", () => {
          setSelectedHub(hub);
          map.flyTo(hub.coords, 6, { duration: 1.2 });
        });
      });
    }

    initLeafletMap();

    return () => {
      isMounted = false;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Changement dynamique du fond de carte (Réseau clair vs Satellite)
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;

    const tileUrl =
      mapStyle === "satellite"
        ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

    tileLayerRef.current.setUrl(tileUrl);
  }, [mapStyle]);

  // Recalcule la taille de la carte si la slide devient active
  useEffect(() => {
    if (isActive && mapInstanceRef.current) {
      setTimeout(() => {
        mapInstanceRef.current?.invalidateSize();
      }, 250);
    }
  }, [isActive]);

  // Alternance automatique du mode de carte à chaque tour du carousel (tour en tour : Clarté -> Satellite -> Clarté...)
  const cycleCountRef = useRef(0);
  useEffect(() => {
    if (isActive) {
      cycleCountRef.current += 1;
      const nextStyle: "streets" | "satellite" = cycleCountRef.current % 2 === 1 ? "streets" : "satellite";
      setMapStyle(nextStyle);
    }
  }, [isActive]);

  return (
    <div className="relative h-full w-full overflow-hidden bg-stone-100">
      {/* Conteneur Leaflet réel, lumineux et visible */}
      <div ref={mapContainerRef} className="h-full w-full z-0" />

      {/* Barre supérieure droite : Indicateur & Sélecteur de mode (Clarté / Satellite) alterné à chaque tour */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20 flex items-center">
        <div className="flex items-center gap-1 rounded-full border border-white/40 bg-stone-950/70 p-1 backdrop-blur-md shadow-lg text-white">
          <button
            type="button"
            onClick={() => setMapStyle("streets")}
            className={`flex items-center gap-1 rounded-full px-3 py-1 text-[11px] sm:text-xs font-semibold transition-all cursor-pointer ${
              mapStyle === "streets"
                ? "bg-amber-400 text-stone-950 shadow-sm font-bold"
                : "text-white/80 hover:text-white"
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Carte Clarté</span>
          </button>
          <button
            type="button"
            onClick={() => setMapStyle("satellite")}
            className={`flex items-center gap-1 rounded-full px-3 py-1 text-[11px] sm:text-xs font-semibold transition-all cursor-pointer ${
              mapStyle === "satellite"
                ? "bg-amber-400 text-stone-950 shadow-sm font-bold"
                : "text-white/80 hover:text-white"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Satellite</span>
          </button>
        </div>
      </div>

      {/* Indicateur de flux logistique actif */}
      <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 z-20 hidden md:flex items-center gap-2 rounded-full border border-white/30 bg-stone-950/60 px-3 py-1 text-[11px] font-medium text-amber-200 backdrop-blur-md shadow-md">
        <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping" />
        <span>Flux logistique en direct : Abidjan vers 5 pays de la sous-région</span>
      </div>
    </div>
  );
}
