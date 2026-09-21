import { useEffect, useRef, useState, useCallback } from "react";
import {
  MapPin,
  Search,
  Crosshair,
  Loader2,
  RotateCcw,
} from "lucide-react";
import {
  DeliveryLocationInfo,
  OFFICIAL_HUBS,
  computeDeliveryInfo,
} from "@/lib/distribution-map.constants";

// Calcule un point sur la courbe de Bézier quadratique entre start et end
function getBezierPoint(
  start: [number, number],
  end: [number, number],
  t: number
): [number, number] {
  const [lat1, lon1] = start;
  const [lat2, lon2] = end;

  const midLat = (lat1 + lat2) / 2 + Math.abs(lon2 - lon1) * 0.16;
  const midLon = (lon1 + lon2) / 2;

  const lat = (1 - t) * (1 - t) * lat1 + 2 * (1 - t) * t * midLat + t * t * lat2;
  const lon = (1 - t) * (1 - t) * lon1 + 2 * (1 - t) * t * midLon + t * t * lon2;
  return [lat, lon];
}

function getArcPoints(
  start: [number, number],
  end: [number, number],
  numPoints = 35
): [number, number][] {
  const points: [number, number][] = [];
  for (let i = 0; i <= numPoints; i++) {
    points.push(getBezierPoint(start, end, i / numPoints));
  }
  return points;
}

interface InteractiveDistributionMapProps {
  currentLocation?: DeliveryLocationInfo;
  onLocationChange?: (location: DeliveryLocationInfo) => void;
  className?: string;
}

export function InteractiveDistributionMap({
  currentLocation,
  onLocationChange,
  className = "",
}: InteractiveDistributionMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);
  const animFrameRef = useRef<number | null>(null);
  const destinationMarkerRef = useRef<any>(null);
  const destinationRouteRef = useRef<any>(null);

  // Deux modes uniquement demandés par l'utilisateur : Clarté (OSM) et Satellite
  const [mapStyle, setMapStyle] = useState<"voyager" | "satellite">("voyager");
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<DeliveryLocationInfo>(
    currentLocation || OFFICIAL_HUBS[0]
  );
  const [isLocating, setIsLocating] = useState(false);

  const abidjanHQ = OFFICIAL_HUBS[0];

  // Synchronisation avec les props externes
  useEffect(() => {
    if (currentLocation && currentLocation.name !== selectedLocation.name) {
      setSelectedLocation(currentLocation);
      if (mapInstanceRef.current) {
        const zoom =
          currentLocation.distanceKm > 2000
            ? 5
            : currentLocation.distanceKm > 200
            ? 7
            : 12;
        mapInstanceRef.current.flyTo(currentLocation.coords, zoom, {
          duration: 1.4,
          easeLinearity: 0.25,
        });
      }
    }
  }, [currentLocation]);

  // Gestionnaire de sélection d'emplacement
  const handleSelectLocation = useCallback(
    (loc: DeliveryLocationInfo) => {
      setSelectedLocation(loc);
      if (onLocationChange) {
        onLocationChange(loc);
      }

      if (mapInstanceRef.current) {
        const zoom =
          loc.distanceKm > 2000 ? 5 : loc.distanceKm > 200 ? 7 : 12;
        mapInstanceRef.current.flyTo(loc.coords, zoom, {
          duration: 1.4,
          easeLinearity: 0.25,
        });
      }
    },
    [onLocationChange]
  );

  // Recherche via l'API Nominatim OpenStreetMap
  const handleSearch = async (queryText: string) => {
    if (!queryText.trim()) return;
    setIsSearching(true);
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        queryText
      )}&limit=5&addressdetails=1`;
      const res = await fetch(url, {
        headers: {
          "Accept-Language": "fr",
        },
      });
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data);
        setShowResults(true);
      }
    } catch (err) {
      console.error("Erreur Nominatim:", err);
    } finally {
      setIsSearching(false);
    }
  };

  // Géolocalisation via l'API HTML5 Geolocation
  const handleGeolocation = () => {
    if (!navigator.geolocation) {
      alert("La géolocalisation n'est pas supportée par votre navigateur.");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        try {
          const revUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`;
          const res = await fetch(revUrl, {
            headers: { "Accept-Language": "fr" },
          });
          const data = await res.json();
          const placeName =
            data.address?.suburb ||
            data.address?.city ||
            data.address?.town ||
            data.address?.country ||
            "Votre position GPS";
          const fullAddress =
            data.display_name || `${lat.toFixed(4)}, ${lon.toFixed(4)}`;

          const info = computeDeliveryInfo(placeName, fullAddress, [lat, lon]);
          handleSelectLocation(info);
          setSearchQuery(placeName);
        } catch {
          const info = computeDeliveryInfo(
            "Position Détectée",
            "Coordonnées GPS directes",
            [lat, lon]
          );
          handleSelectLocation(info);
        } finally {
          setIsLocating(false);
        }
      },
      (err) => {
        setIsLocating(false);
        console.warn("Erreur de géolocalisation:", err.message);
      },
      { timeout: 8000 }
    );
  };

  // Initialisation de la carte Leaflet
  useEffect(() => {
    let isMounted = true;

    async function initLeaflet() {
      if (typeof window === "undefined" || !mapContainerRef.current) return;
      if (mapInstanceRef.current) return;

      const L = (await import("leaflet")).default;
      if (!isMounted || !mapContainerRef.current) return;

      const map = L.map(mapContainerRef.current, {
        center: [9.6, -3.5],
        zoom: 5.2,
        minZoom: 3.5,
        maxZoom: 16,
        scrollWheelZoom: false,
        doubleClickZoom: true,
        touchZoom: true,
        dragging: true,
        zoomControl: false,
        attributionControl: false,
      });

      mapInstanceRef.current = map;

      const tileUrls = {
        voyager: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
        satellite:
          "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      };

      const tileLayer = L.tileLayer(tileUrls[mapStyle], {
        maxZoom: 18,
      }).addTo(map);

      tileLayerRef.current = tileLayer;

      // Contrôle de zoom discret en bas à droite
      L.control.zoom({ position: "bottomright" }).addTo(map);

      // Tracé des flux logistiques vers les hubs officiels
      const secondaryHubs = OFFICIAL_HUBS.slice(1);
      const particles: {
        marker: any;
        start: [number, number];
        end: [number, number];
        progress: number;
        speed: number;
      }[] = [];

      secondaryHubs.forEach((hub) => {
        const arc = getArcPoints(abidjanHQ.coords, hub.coords);

        // Lueur dorée sobre
        L.polyline(arc, {
          color: "#B45309",
          weight: 3,
          opacity: 0.3,
          lineCap: "round",
        }).addTo(map);

        // Ligne de flux en pointillés élégants
        L.polyline(arc, {
          className: "leaflet-flow-path",
          color: "#D97706",
          weight: 2,
          opacity: 0.85,
          lineCap: "round",
        }).addTo(map);

        // Particules d'énergie mobiles douces
        [0, 0.5].forEach((offset) => {
          const particleIcon = L.divIcon({
            className: "leaflet-packet-marker",
            html: `
              <div class="relative flex items-center justify-center pointer-events-none">
                <span class="h-2 w-2 rounded-full bg-amber-500 border border-white shadow-sm"></span>
              </div>
            `,
            iconSize: [10, 10],
            iconAnchor: [5, 5],
          });

          const initialPt = getBezierPoint(abidjanHQ.coords, hub.coords, offset);
          const pMarker = L.marker(initialPt, {
            icon: particleIcon,
            interactive: false,
          }).addTo(map);

          particles.push({
            marker: pMarker,
            start: abidjanHQ.coords,
            end: hub.coords,
            progress: offset,
            speed: 0.006 + Math.random() * 0.002,
          });
        });
      });

      // Boucle d'animation fluide
      function animateFlow() {
        if (!isMounted) return;
        particles.forEach((p) => {
          p.progress += p.speed;
          if (p.progress >= 1) p.progress = 0;
          const pt = getBezierPoint(p.start, p.end, p.progress);
          p.marker.setLatLng(pt);
        });
        animFrameRef.current = requestAnimationFrame(animateFlow);
      }
      animFrameRef.current = requestAnimationFrame(animateFlow);

      // Marqueurs pour les Hubs
      OFFICIAL_HUBS.forEach((hub) => {
        const isCentral = hub.id === "abidjan";
        const iconHtml = `
          <div class="relative flex items-center justify-center cursor-pointer group">
            <span class="relative flex ${
              isCentral ? "h-5 w-5" : "h-3.5 w-3.5"
            } items-center justify-center rounded-full bg-stone-900 border-2 border-amber-400 shadow-md transition-transform duration-300 group-hover:scale-125">
              <span class="${isCentral ? "h-2 w-2 bg-amber-400" : "h-1.5 w-1.5 bg-amber-300"} rounded-full"></span>
            </span>
            <span class="absolute top-5 whitespace-nowrap text-[10.5px] font-semibold tracking-tight ${
              isCentral
                ? "text-amber-900 bg-amber-50 border-amber-300 font-bold"
                : "text-stone-800 bg-white/95 border-stone-200"
            } px-2 py-0.5 rounded-md border shadow-xs pointer-events-none transition-all group-hover:shadow-md">
              ${hub.name.split(" ")[0]} ${isCentral ? "★ Siège" : ""}
            </span>
          </div>
        `;

        const markerIcon = L.divIcon({
          html: iconHtml,
          className: "custom-hub-marker",
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });

        const marker = L.marker(hub.coords, { icon: markerIcon }).addTo(map);
        marker.on("click", () => {
          handleSelectLocation(hub);
        });
      });

      // Clic sur la carte pour géocodage inverse
      map.on("click", async (e: any) => {
        const { lat, lng } = e.latlng;
        try {
          const revUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`;
          const res = await fetch(revUrl, {
            headers: { "Accept-Language": "fr" },
          });
          if (res.ok) {
            const data = await res.json();
            const placeName =
              data.address?.suburb ||
              data.address?.city ||
              data.address?.town ||
              data.address?.country ||
              "Point sélectionné";
            const fullAddress =
              data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
            const info = computeDeliveryInfo(placeName, fullAddress, [lat, lng]);
            handleSelectLocation(info);
          }
        } catch {
          const info = computeDeliveryInfo(
            "Emplacement personnalisé",
            `GPS : ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
            [lat, lng]
          );
          handleSelectLocation(info);
        }
      });
    }

    initLeaflet();

    return () => {
      isMounted = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [handleSelectLocation, abidjanHQ.coords]);

  // Basculement dynamique Clarté / Satellite
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    if (tileLayerRef.current) {
      tileLayerRef.current.remove();
      tileLayerRef.current = null;
    }

    import("leaflet").then((LModule) => {
      const L = LModule.default;
      const tileUrls = {
        voyager: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
        satellite:
          "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      };

      const newTile = L.tileLayer(tileUrls[mapStyle], {
        maxZoom: 18,
      }).addTo(map);

      newTile.bringToBack();
      tileLayerRef.current = newTile;
    });
  }, [mapStyle]);

  // Tracé dynamique de la destination sélectionnée
  useEffect(() => {
    async function updateActiveMarker() {
      if (!mapInstanceRef.current || !selectedLocation) return;
      const L = (await import("leaflet")).default;
      const map = mapInstanceRef.current;

      if (destinationMarkerRef.current) {
        destinationMarkerRef.current.remove();
        destinationMarkerRef.current = null;
      }
      if (destinationRouteRef.current) {
        destinationRouteRef.current.remove();
        destinationRouteRef.current = null;
      }

      // Tracé de la ligne vers la destination
      if (selectedLocation.id !== "abidjan") {
        const arc = getArcPoints(abidjanHQ.coords, selectedLocation.coords);
        const route = L.polyline(arc, {
          color: "#D97706",
          weight: 2.5,
          dashArray: "6, 6",
          opacity: 0.9,
        }).addTo(map);
        destinationRouteRef.current = route;
      }

      // Marqueur de destination épuré
      const destHtml = `
        <div class="relative flex items-center justify-center pointer-events-none">
          <div class="relative flex h-7 w-7 items-center justify-center rounded-full bg-amber-500 border-2 border-white shadow-md">
            <svg class="h-3.5 w-3.5 text-stone-950" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          </div>
        </div>
      `;

      const destIcon = L.divIcon({
        html: destHtml,
        className: "active-destination-marker",
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const marker = L.marker(selectedLocation.coords, {
        icon: destIcon,
        zIndexOffset: 1000,
      }).addTo(map);

      // Popup de destination sobre et précis
      const popupHtml = `
        <div class="p-2 min-w-[170px] text-stone-900 font-sans">
          <div class="text-[10px] font-semibold text-amber-700 uppercase tracking-wider mb-0.5">Point de livraison</div>
          <div class="font-bold text-sm text-stone-950 leading-snug">${selectedLocation.name}</div>
          <div class="text-[11px] text-stone-600 mt-1 line-clamp-2">${selectedLocation.address}</div>
        </div>
      `;
      marker.bindPopup(popupHtml).openPopup();
      destinationMarkerRef.current = marker;
    }

    updateActiveMarker();
  }, [selectedLocation, abidjanHQ.coords]);

  const resetView = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([9.6, -3.5], 5.2, { duration: 1.2 });
    }
  };

  return (
    <div className={`relative flex flex-col h-full w-full overflow-hidden bg-stone-100 ${className}`}>
      {/* Contrôles supérieurs discrets : Recherche & Sélecteur Clarté/Satellite */}
      <div className="absolute top-4 inset-x-4 z-[1000] flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between pointer-events-none">
        {/* Recherche d'adresse */}
        <div className="relative pointer-events-auto flex-1 max-w-sm">
          <div className="flex items-center rounded-xl border border-stone-300/80 bg-white/95 backdrop-blur-md px-3 py-2 text-xs text-stone-800 shadow-sm focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/20 transition">
            <Search className="h-4 w-4 text-stone-400 shrink-0 mr-2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (e.target.value.length > 2) {
                  handleSearch(e.target.value);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearch(searchQuery);
                }
              }}
              placeholder="Rechercher une ville, commune..."
              className="w-full bg-transparent text-xs text-stone-800 placeholder-stone-400 focus:outline-none"
            />
            {isSearching && (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-600 shrink-0 ml-1" />
            )}
            <button
              type="button"
              onClick={handleGeolocation}
              disabled={isLocating}
              title="Me géolocaliser"
              className="ml-1 p-1 rounded-md text-stone-500 hover:text-amber-700 hover:bg-stone-100 transition cursor-pointer"
            >
              {isLocating ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Crosshair className="h-4 w-4" />
              )}
            </button>
          </div>

          {/* Liste déroulante des résultats Nominatim */}
          {showResults && searchResults.length > 0 && (
            <div className="absolute top-full mt-1.5 inset-x-0 rounded-xl border border-stone-200 bg-white shadow-xl overflow-hidden py-1 max-h-48 overflow-y-auto">
              {searchResults.map((res: any, idx: number) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    const lat = parseFloat(res.lat);
                    const lon = parseFloat(res.lon);
                    const name =
                      res.address?.suburb ||
                      res.address?.city ||
                      res.address?.town ||
                      res.name ||
                      "Lieu sélectionné";
                    const info = computeDeliveryInfo(name, res.display_name, [
                      lat,
                      lon,
                    ]);
                    handleSelectLocation(info);
                    setShowResults(false);
                    setSearchQuery(name);
                  }}
                  className="w-full px-3 py-2 text-left text-xs hover:bg-amber-50 text-stone-700 hover:text-stone-950 border-b border-stone-100 last:border-0 flex items-start gap-2 cursor-pointer transition"
                >
                  <MapPin className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <span className="truncate">{res.display_name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Sélecteur de styles épuré : Clarté & Satellite uniquement */}
        <div className="pointer-events-auto flex items-center self-end sm:self-auto gap-1 rounded-xl border border-stone-200/90 bg-white/95 p-1 backdrop-blur-md shadow-sm">
          <button
            type="button"
            onClick={() => setMapStyle("voyager")}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
              mapStyle === "voyager"
                ? "bg-amber-500 text-stone-950 shadow-xs"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            Clarté
          </button>
          <button
            type="button"
            onClick={() => setMapStyle("satellite")}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
              mapStyle === "satellite"
                ? "bg-amber-500 text-stone-950 shadow-xs"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            Satellite
          </button>
          <button
            type="button"
            onClick={resetView}
            title="Recentrer sur l'Afrique de l'Ouest"
            className="p-1.5 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Conteneur Leaflet réel occupant 100% de l'espace */}
      <div
        ref={mapContainerRef}
        className="h-full w-full z-0 cursor-crosshair min-h-[500px]"
      />
    </div>
  );
}
