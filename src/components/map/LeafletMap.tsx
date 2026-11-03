"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useMemo, useRef } from "react";
import { Circle, MapContainer, Marker, TileLayer, Tooltip, ZoomControl, useMap } from "react-leaflet";
import { DEFAULT_CENTER } from "@/lib/geocode";
import { TONE_STYLES, type PinnedItem } from "./types";

export type MapPadding = { top: number; right: number; bottom: number; left: number };

type Props = {
  /** Every record in the active tab; those with a `point` get a pin. */
  items: PinnedItem[];
  selectedId: string | null;
  /** A pin was clicked. */
  onSelect: (id: string) => void;
  /** Screen space covered by the floating pane / bottom sheet, so pins land in the visible part. */
  padding: MapPadding;
  /** True once every pin has at least its barangay-level point (time for a final framing). */
  settled: boolean;
  /** +/- buttons (off on phones, where pinch-zoom is natural and the corner holds the search bar). */
  zoomControl?: boolean;
};

const escapeAttr = (value: string) => value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
const isApproximate = (item: PinnedItem) => item.point?.precision === "barangay" || item.point?.precision === "municipality";

const smallIcons = new Map<string, L.DivIcon>();

/** A status-coloured pin; dashed outline when it only marks the barangay/city center. */
function smallPin(color: string, approximate: boolean) {
  const key = `${color}-${approximate}`;
  const hit = smallIcons.get(key);
  if (hit) return hit;
  const size = 30;
  const icon = L.divIcon({
    className: "seebu-pin",
    iconSize: [size, size],
    iconAnchor: [size / 2, size - 1],
    tooltipAnchor: [0, -size + 4],
    html: `<svg width="${size}" height="${size}" viewBox="0 0 32 32" aria-hidden="true" style="filter:drop-shadow(0 1px 2px rgba(15,23,42,.4))">
      <path d="M16 1.5C9.6 1.5 4.5 6.5 4.5 12.8c0 8.3 10 16.8 10.5 17.2a1.5 1.5 0 0 0 2 0c.5-.4 10.5-8.9 10.5-17.2C27.5 6.5 22.4 1.5 16 1.5z"
        fill="${color}" stroke="#fff" stroke-width="2.5" ${approximate ? 'stroke-dasharray="3 2"' : ""}/>
      <circle cx="16" cy="12.5" r="4.5" fill="#fff"/>
    </svg>`,
  });
  smallIcons.set(key, icon);
  return icon;
}

/** The selected record: a photo bubble (first report image) with a pointer, or a big pin without a photo. */
function selectedPin(color: string, photo: string | undefined, approximate: boolean) {
  if (photo) {
    const w = 72;
    const h = 84;
    return L.divIcon({
      className: "seebu-pin",
      iconSize: [w, h],
      iconAnchor: [w / 2, h],
      tooltipAnchor: [0, -h],
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
    tooltipAnchor: [0, -size + 6],
    html: `<svg width="${size}" height="${size}" viewBox="0 0 32 32" aria-hidden="true" style="filter:drop-shadow(0 3px 4px rgba(15,23,42,.4))">
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

function Viewport({ items, selectedId, padding, settled }: Pick<Props, "items" | "selectedId" | "padding" | "settled">) {
  const map = useMap();
  const paddingRef = useRef(padding);
  paddingRef.current = padding;
  const selectedRef = useRef(selectedId);
  selectedRef.current = selectedId;

  // Frame the tab's pins: once when the first ones appear, once more when all are placed. Never
  // while a pin is selected, and not after the user has panned or zoomed the map themselves.
  const idsKey = items.map((i) => i.id).join("|");
  const pinned = items.filter((i) => i.point);
  const framed = useRef({ key: "", first: false, settled: false, userMoved: false });
  useEffect(() => {
    const onUserMove = () => { framed.current.userMoved = true; };
    map.on("dragstart", onUserMove);
    map.getContainer().addEventListener("wheel", onUserMove, { passive: true });
    return () => {
      map.off("dragstart", onUserMove);
      map.getContainer().removeEventListener("wheel", onUserMove);
    };
  }, [map]);
  useEffect(() => {
    const f = framed.current;
    if (f.key !== idsKey) Object.assign(f, { key: idsKey, first: false, settled: false, userMoved: false });
    if (!pinned.length || selectedRef.current || f.userMoved) return;
    if (f.first && (f.settled || !settled)) return;
    f.first = true;
    f.settled = settled;
    const p = paddingRef.current;
    map.fitBounds(L.latLngBounds(pinned.map((i) => [i.point!.lat, i.point!.lng] as [number, number])), {
      paddingTopLeft: [p.left + 40, p.top + 40],
      paddingBottomRight: [p.right + 40, p.bottom + 40],
      maxZoom: 16,
      animate: true,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, idsKey, pinned.length > 0, settled]);

  // Fly to the selected pin (again if it moves from its barangay center to its street).
  const point = items.find((i) => i.id === selectedId)?.point;
  useEffect(() => {
    if (!point) return;
    const zoom = point.precision === "street" || point.precision === "exact" ? 17 : point.precision === "barangay" ? 15 : 13;
    map.flyTo(centerFor(map, [point.lat, point.lng], Math.max(zoom, map.getZoom()), paddingRef.current), Math.max(zoom, map.getZoom()), { duration: 0.8 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, selectedId, point?.lat, point?.lng]);

  return null;
}

/** The tile map itself. Loaded client-only (Leaflet needs `window`). */
export default function LeafletMap({ items, selectedId, onSelect, padding, settled, zoomControl = true }: Props) {
  const selected = items.find((i) => i.id === selectedId && i.point);
  const sp = selected?.point;
  const approxRadius = sp?.precision === "barangay" ? 450 : sp?.precision === "municipality" ? 1500 : 0;

  // Selected pin drawn last so it sits on top.
  const markers = useMemo(
    () => items.filter((i) => i.point).sort((a, b) => Number(a.id === selectedId) - Number(b.id === selectedId)),
    [items, selectedId]
  );

  return (
    <MapContainer center={DEFAULT_CENTER} zoom={13} zoomControl={false} className="h-full w-full" attributionControl worldCopyJump>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
        className="seebu-tiles"
      />
      {zoomControl && <ZoomControl position="topright" />}
      <Viewport items={items} selectedId={selectedId} padding={padding} settled={settled} />

      {selected && sp && approxRadius > 0 && (
        <Circle
          center={[sp.lat, sp.lng]}
          radius={approxRadius}
          pathOptions={{ color: TONE_STYLES[selected.tone].pin, weight: 2, dashArray: "6 6", fillOpacity: 0.12 }}
        />
      )}

      {markers.map((item) => {
        const isSelected = item.id === selectedId;
        const color = TONE_STYLES[item.tone].pin;
        return (
          <Marker
            key={`${item.id}-${isSelected}`}
            position={[item.point!.lat, item.point!.lng]}
            icon={isSelected ? selectedPin(color, item.photos?.[0], isApproximate(item)) : smallPin(color, isApproximate(item))}
            alt={`${item.title} (${item.statusLabel || item.status})`}
            keyboard
            riseOnHover
            zIndexOffset={isSelected ? 1000 : 0}
            eventHandlers={{ click: () => onSelect(item.id) }}
          >
            {!isSelected && (
              <Tooltip direction="top" opacity={1} className="seebu-pin-tip">
                <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 999, background: color, marginRight: 6 }} />
                <strong>{item.statusLabel || item.status}</strong> · {item.title}
              </Tooltip>
            )}
          </Marker>
        );
      })}
    </MapContainer>
  );
}
