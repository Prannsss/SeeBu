"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useRef } from "react";
import { Circle, MapContainer, Marker, TileLayer, ZoomControl, useMap } from "react-leaflet";
import { DEFAULT_CENTER } from "@/lib/geocode";
import { TONE_STYLES, type PinnedItem } from "./types";

export type MapPadding = { top: number; right: number; bottom: number; left: number };

type Props = {
  /** The one record on the map (the selected one), or null for an empty map. */
  item: PinnedItem | null;
  /** The pin was clicked. */
  onOpen: () => void;
  /** Screen space covered by the floating pane / bottom sheet, so the pin lands in the visible part. */
  padding: MapPadding;
  /** +/- buttons (off on phones, where pinch-zoom is natural and the corner holds the search bar). */
  zoomControl?: boolean;
};

const escapeAttr = (value: string) => value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

/** A photo bubble (report's first image) with a pointer, or a plain pin when there's no photo. */
function pinIcon(color: string, photo: string | undefined, approximate: boolean) {
  if (photo) {
    const w = 72;
    const h = 84;
    return L.divIcon({
      className: "seebu-pin",
      iconSize: [w, h],
      iconAnchor: [w / 2, h],
      html: `<div style="position:relative;width:${w}px;height:${h}px;filter:drop-shadow(0 4px 8px rgba(15,23,42,.35))">
        <div style="width:${w}px;height:${w}px;border-radius:16px;background:${color};padding:3px;box-sizing:border-box">
          <img src="${escapeAttr(photo)}" alt="" loading="eager" referrerpolicy="no-referrer"
            style="display:block;width:100%;height:100%;object-fit:cover;border-radius:13px;border:2px solid #fff;box-sizing:border-box;background:#e2e8f0"/>
        </div>
        <div style="position:absolute;left:50%;bottom:0;width:0;height:0;transform:translateX(-50%);
          border-left:9px solid transparent;border-right:9px solid transparent;border-top:13px solid ${color}"></div>
        ${approximate ? `<span style="position:absolute;top:-6px;right:-6px;background:#fff;color:#92400e;border:1px solid #fcd34d;border-radius:999px;font:700 9px/1 system-ui,sans-serif;padding:3px 5px">≈</span>` : ""}
      </div>`,
    });
  }
  const size = 48;
  return L.divIcon({
    className: "seebu-pin",
    iconSize: [size, size],
    iconAnchor: [size / 2, size - 2],
    html: `<svg width="${size}" height="${size}" viewBox="0 0 32 32" aria-hidden="true" style="filter:drop-shadow(0 2px 3px rgba(15,23,42,.35))">
      <path d="M16 1.5C9.6 1.5 4.5 6.5 4.5 12.8c0 8.3 10 16.8 10.5 17.2a1.5 1.5 0 0 0 2 0c.5-.4 10.5-8.9 10.5-17.2C27.5 6.5 22.4 1.5 16 1.5z"
        fill="${color}" stroke="#fff" stroke-width="2" ${approximate ? 'stroke-dasharray="3 2"' : ""}/>
      <circle cx="16" cy="12.5" r="4.5" fill="#fff"/>
    </svg>`,
  });
}

/** Point the map so `latlng` sits in the middle of the visible (uncovered) area. */
function centerFor(map: L.Map, latlng: L.LatLngExpression, zoom: number, padding: MapPadding) {
  // Nudge down a little so a tall photo pin isn't cut off at the top.
  const shift = L.point((padding.left - padding.right) / 2, (padding.top - padding.bottom) / 2 + 40);
  return map.unproject(map.project(latlng, zoom).subtract(shift), zoom);
}

function FlyToItem({ item, padding }: { item: PinnedItem | null; padding: MapPadding }) {
  const map = useMap();
  const paddingRef = useRef(padding);
  paddingRef.current = padding;
  const point = item?.point;
  useEffect(() => {
    if (!point) return;
    const zoom = point.precision === "street" || point.precision === "exact" ? 17 : point.precision === "barangay" ? 15 : 13;
    map.flyTo(centerFor(map, [point.lat, point.lng], zoom, paddingRef.current), zoom, { duration: 0.8 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, item?.id, point?.lat, point?.lng]);
  return null;
}

/** The tile map itself. Loaded client-only (Leaflet needs `window`). */
export default function LeafletMap({ item, onOpen, padding, zoomControl = true }: Props) {
  const point = item?.point;
  const approximate = point?.precision === "barangay" || point?.precision === "municipality";
  const approxRadius = point?.precision === "barangay" ? 450 : point?.precision === "municipality" ? 1500 : 0;
  const color = item ? TONE_STYLES[item.tone].pin : "#000";

  return (
    <MapContainer center={DEFAULT_CENTER} zoom={13} zoomControl={false} className="h-full w-full" attributionControl worldCopyJump>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />
      {zoomControl && <ZoomControl position="topright" />}
      <FlyToItem item={item} padding={padding} />

      {item && point && approxRadius > 0 && (
        <Circle
          center={[point.lat, point.lng]}
          radius={approxRadius}
          pathOptions={{ color, weight: 2, dashArray: "6 6", fillOpacity: 0.12 }}
        />
      )}

      {item && point && (
        <Marker
          key={item.id}
          position={[point.lat, point.lng]}
          icon={pinIcon(color, item.photos?.[0], approximate)}
          title={`${item.title} — open details`}
          alt={item.title}
          keyboard
          eventHandlers={{ click: onOpen }}
        />
      )}
    </MapContainer>
  );
}
