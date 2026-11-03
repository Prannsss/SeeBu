"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useMemo, useRef } from "react";
import { Circle, MapContainer, Marker, TileLayer, ZoomControl, useMap } from "react-leaflet";
import { DEFAULT_CENTER } from "@/lib/geocode";
import { TONE_STYLES, type PinnedItem } from "./types";

export type MapPadding = { top: number; right: number; bottom: number; left: number };

type Props = {
  items: PinnedItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  /** Screen space covered by the floating pane / bottom sheet, so pins are framed in the visible part. */
  padding: MapPadding;
  /** +/- buttons (off on phones, where pinch-zoom is natural and the corner holds the search bar). */
  zoomControl?: boolean;
};

const iconCache = new Map<string, L.DivIcon>();

function pinIcon(color: string, selected: boolean, approximate: boolean) {
  const key = `${color}-${selected}-${approximate}`;
  const hit = iconCache.get(key);
  if (hit) return hit;
  const size = selected ? 44 : 32;
  const icon = L.divIcon({
    className: "seebu-pin",
    iconSize: [size, size],
    iconAnchor: [size / 2, size - 2],
    html: `<svg width="${size}" height="${size}" viewBox="0 0 32 32" aria-hidden="true" style="filter:drop-shadow(0 2px 3px rgba(15,23,42,.35))">
      <path d="M16 1.5C9.6 1.5 4.5 6.5 4.5 12.8c0 8.3 10 16.8 10.5 17.2a1.5 1.5 0 0 0 2 0c.5-.4 10.5-8.9 10.5-17.2C27.5 6.5 22.4 1.5 16 1.5z"
        fill="${color}" stroke="#fff" stroke-width="2" ${approximate ? 'stroke-dasharray="3 2"' : ""}/>
      <circle cx="16" cy="12.5" r="4.5" fill="#fff"/>
    </svg>`,
  });
  iconCache.set(key, icon);
  return icon;
}

/** Point the map so `latlng` sits in the middle of the visible (uncovered) area. */
function centerFor(map: L.Map, latlng: L.LatLngExpression, zoom: number, padding: MapPadding) {
  const shift = L.point((padding.left - padding.right) / 2, (padding.top - padding.bottom) / 2);
  return map.unproject(map.project(latlng, zoom).subtract(shift), zoom);
}

function Viewport({ items, selectedId, padding }: Pick<Props, "items" | "selectedId" | "padding">) {
  const map = useMap();
  const paddingRef = useRef(padding);
  paddingRef.current = padding;

  // Re-frame whenever the set of pins changes (new filter, new page, geocoding finished).
  const pinned = items.filter((i) => i.point);
  const pinKey = pinned.map((i) => i.id).join("|");
  const selectedRef = useRef(selectedId);
  selectedRef.current = selectedId;
  useEffect(() => {
    // Don't yank the view away from a pin the user is looking at.
    if (!pinned.length || selectedRef.current) return;
    const p = paddingRef.current;
    const bounds = L.latLngBounds(pinned.map((i) => [i.point!.lat, i.point!.lng] as [number, number]));
    map.fitBounds(bounds, {
      paddingTopLeft: [p.left + 40, p.top + 40],
      paddingBottomRight: [p.right + 40, p.bottom + 40],
      maxZoom: 16,
      animate: true,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, pinKey]);

  // Fly to the selected pin.
  const selected = pinned.find((i) => i.id === selectedId);
  const selectedPoint = selected?.point;
  useEffect(() => {
    if (!selectedPoint) return;
    const zoom = Math.max(map.getZoom(), selectedPoint.precision === "street" || selectedPoint.precision === "exact" ? 17 : 15);
    map.flyTo(centerFor(map, [selectedPoint.lat, selectedPoint.lng], zoom, paddingRef.current), zoom, { duration: 0.8 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, selectedId, selectedPoint?.lat, selectedPoint?.lng]);

  return null;
}

/** The tile map itself. Loaded client-only (Leaflet needs `window`). */
export default function LeafletMap({ items, selectedId, onSelect, padding, zoomControl = true }: Props) {
  const selected = items.find((i) => i.id === selectedId && i.point);
  const approxRadius = selected?.point?.precision === "barangay" ? 450 : selected?.point?.precision === "municipality" ? 1500 : 0;

  const markers = useMemo(
    () =>
      items
        .filter((i) => i.point)
        // Selected pin drawn last so it sits on top.
        .sort((a, b) => Number(a.id === selectedId) - Number(b.id === selectedId)),
    [items, selectedId]
  );

  return (
    <MapContainer
      center={DEFAULT_CENTER}
      zoom={13}
      zoomControl={false}
      className="h-full w-full"
      attributionControl
      worldCopyJump
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />
      {zoomControl && <ZoomControl position="topright" />}
      <Viewport items={items} selectedId={selectedId} padding={padding} />

      {selected?.point && approxRadius > 0 && (
        <Circle
          center={[selected.point.lat, selected.point.lng]}
          radius={approxRadius}
          pathOptions={{ color: TONE_STYLES[selected.tone].pin, weight: 2, dashArray: "6 6", fillOpacity: 0.12 }}
        />
      )}

      {markers.map((item) => (
        <Marker
          key={item.id}
          position={[item.point!.lat, item.point!.lng]}
          icon={pinIcon(TONE_STYLES[item.tone].pin, item.id === selectedId, item.point!.precision === "barangay" || item.point!.precision === "municipality")}
          title={item.title}
          alt={item.title}
          keyboard
          zIndexOffset={item.id === selectedId ? 1000 : 0}
          eventHandlers={{ click: () => onSelect(item.id) }}
        />
      ))}
    </MapContainer>
  );
}
