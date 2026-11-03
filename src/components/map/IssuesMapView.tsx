"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import {
  AlertCircle,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Crosshair,
  ExternalLink,
  Landmark,
  Loader2,
  MapPin,
  Navigation,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { IdPill } from "@/components/ui/id-pill";
import { ReportMediaGallery } from "@/components/reports/report-media-gallery";
import { statusBadgeClass, urgencyBadgeClass } from "@/lib/status-styles";
import { formatPhDate } from "@/lib/ph-date";
import { geocodeAddress, offsetDuplicate, precisionLabel, type GeoPoint } from "@/lib/geocode";
import { TONE_STYLES, type MapFilter, type MapItem, type MapTone, type PinnedItem } from "./types";
import type { MapPadding } from "./LeafletMap";

const LeafletMap = dynamic(() => import("./LeafletMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-slate-100 text-sm text-slate-600">
      <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> Loading map…
    </div>
  ),
});

export type IssuesMapViewProps = {
  title: string;
  subtitle?: string;
  items: MapItem[];
  isLoading?: boolean;
  /** Shown instead of the list (e.g. the profile didn't load). */
  error?: ReactNode;
  filters: MapFilter[];
  activeFilter: string;
  onFilterChange: (value: string) => void;
  /** Extra controls beside the search box (e.g. an urgency select). */
  toolbar?: ReactNode;
  legend: MapTone[];
  page?: number;
  totalPages?: number;
  total?: number;
  onPageChange?: (page: number) => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  /** Where "Open" in the details modal leads (the role's full workflow page). */
  detailsLink?: (item: MapItem) => { href: string; label: string } | null;
  emptyText?: string;
  /** Plural noun for the count in the mobile sheet header, e.g. "reports". */
  noun?: string;
};

const PANE_WIDTH_KEY = "seebu-map-pane-width";
const PANE_MIN = 320;
const PANE_MAX = 680;
const DOCK_SPACE = 112; // the fixed role dock at the bottom of every staff page
const SHEET_HEADER = 64;

type SheetSnap = "peek" | "half" | "full";

function useIsDesktop() {
  const [desktop, setDesktop] = useState(true);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const update = () => setDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return desktop;
}

function useViewportHeight() {
  const [h, setH] = useState(800);
  useEffect(() => {
    const update = () => setH(window.innerHeight);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return h;
}

const addressKey = (i: MapItem) =>
  [i.lat ?? "", i.lng ?? "", i.street ?? "", i.barangay ?? "", i.municipality ?? ""].join("|").toLowerCase();

/** Geocode each distinct address once (rate-limited + cached in lib/geocode) and attach the points. */
function usePinnedItems(items: MapItem[]) {
  const [points, setPoints] = useState<Record<string, GeoPoint | null>>({});
  const requested = useRef(new Set<string>());

  useEffect(() => {
    let alive = true;
    for (const item of items) {
      const key = addressKey(item);
      if (requested.current.has(key)) continue;
      requested.current.add(key);
      geocodeAddress({ street: item.street, barangay: item.barangay, municipality: item.municipality, lat: item.lat, lng: item.lng })
        .then((point) => {
          if (alive) setPoints((prev) => ({ ...prev, [key]: point }));
          else requested.current.delete(key); // unmounted mid-flight: let a remount ask again (cache makes it free)
        });
    }
    return () => {
      alive = false;
    };
  }, [items]);

  return useMemo(() => {
    const seen = new Map<string, number>();
    let pending = 0;
    let unplaced = 0;
    const pinned: PinnedItem[] = items.map((item) => {
      const key = addressKey(item);
      if (!(key in points)) {
        pending++;
        return item;
      }
      const base = points[key];
      if (!base) {
        unplaced++;
        return item;
      }
      const spot = `${base.lat.toFixed(5)},${base.lng.toFixed(5)}`;
      const n = seen.get(spot) ?? 0;
      seen.set(spot, n + 1);
      return { ...item, point: offsetDuplicate(base, n) };
    });
    return { pinned, pending, unplaced };
  }, [items, points]);
}

const locationLine = (item: MapItem) =>
  [item.barangay, item.municipality].filter((v) => v && v !== "Unknown").join(", ") || "Location not set";

function StatusPill({ item }: { item: MapItem }) {
  return (
    <span className={`inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${statusBadgeClass(item.status)}`}>
      {item.statusLabel || item.status}
    </span>
  );
}

function ItemCard({
  item,
  selected,
  onSelect,
  onOpen,
}: {
  item: PinnedItem;
  selected: boolean;
  onSelect: () => void;
  onOpen: () => void;
}) {
  return (
    <li>
      <div
        className={`rounded-xl border bg-white transition-all dark:bg-slate-900 ${
          selected ? "border-slate-900 shadow-md ring-1 ring-slate-900 dark:border-slate-100 dark:ring-slate-100" : "border-slate-200 hover:border-slate-300 hover:shadow-sm dark:border-slate-800"
        }`}
      >
        <button type="button" onClick={onSelect} className="block w-full rounded-xl p-3.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
          <div className="flex items-start justify-between gap-2">
            <div className="flex min-w-0 items-start gap-2">
              <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${TONE_STYLES[item.tone].dot}`} aria-hidden="true" />
              <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-slate-900 dark:text-slate-100">{item.title}</h3>
            </div>
            <StatusPill item={item} />
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5 pl-[18px]">
            {item.urgency && (
              <span className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-bold capitalize ${urgencyBadgeClass(item.urgency)}`}>
                <AlertCircle className="h-2.5 w-2.5" aria-hidden="true" />
                {item.urgency}
              </span>
            )}
            {item.issueType && (
              <span className="rounded-full border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-medium capitalize text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                {item.issueType.replace(/_/g, " ")}
              </span>
            )}
            <span className="font-mono text-[10px] font-semibold text-slate-500">{item.id}</span>
          </div>
          <div className="mt-2 flex items-center gap-1 pl-[18px] text-xs text-slate-600 dark:text-slate-400">
            <MapPin className="h-3 w-3 shrink-0 text-primary" aria-hidden="true" />
            <span className="truncate">{locationLine(item)}</span>
          </div>
        </button>
        <div className="flex items-center justify-between border-t border-slate-100 px-3.5 py-2 text-xs dark:border-slate-800">
          <span className="flex items-center gap-1 text-slate-500">
            {item.point ? (
              <>
                <Crosshair className="h-3 w-3" aria-hidden="true" />
                {item.point.precision === "street" || item.point.precision === "exact" ? "Pinned" : "Approximate"}
              </>
            ) : (
              <>
                <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" /> Locating…
              </>
            )}
          </span>
          <button type="button" onClick={onOpen} className="inline-flex items-center gap-0.5 font-semibold text-slate-900 hover:text-primary dark:text-slate-100">
            View details <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </li>
  );
}

function DetailsModal({
  item,
  onClose,
  detailsLink,
}: {
  item: PinnedItem | null;
  onClose: () => void;
  detailsLink?: IssuesMapViewProps["detailsLink"];
}) {
  const link = item && detailsLink ? detailsLink(item) : null;
  const point = item?.point;
  return (
    <Dialog open={!!item} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[calc(100%-2rem)] max-h-[88vh] overflow-y-auto rounded-2xl p-0 sm:max-w-2xl [&>div.sticky>button]:right-3 [&>div.sticky>button]:top-3">
        {item && (
          <>
            <DialogHeader className="space-y-2 border-b border-slate-100 p-5 pb-4 text-left dark:border-slate-800">
              <div className="flex items-start gap-3 pr-6">
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white"
                  style={{ backgroundColor: TONE_STYLES[item.tone].pin }}
                  aria-hidden="true"
                >
                  <MapPin className="h-5 w-5" />
                </span>
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <DialogTitle className="text-lg leading-snug">{item.title}</DialogTitle>
                    <StatusPill item={item} />
                  </div>
                  <DialogDescription className="flex items-center gap-1 text-sm">
                    <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    {locationLine(item)}
                  </DialogDescription>
                  {point && (
                    <span className="inline-flex items-center rounded-md border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[11px] font-medium text-emerald-800">
                      {precisionLabel[point.precision]} ({point.lat.toFixed(4)}, {point.lng.toFixed(4)})
                    </span>
                  )}
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-4 p-5">
              <div className="flex flex-wrap items-center gap-2">
                <IdPill id={item.id} label={item.reportId ? "task ID" : "tracking ID"} />
                {item.reportId && item.reportId !== item.id && <IdPill id={item.reportId} label="report ID" />}
                {item.urgency && (
                  <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold capitalize ${urgencyBadgeClass(item.urgency)}`}>{item.urgency} urgency</span>
                )}
                {item.issueType && (
                  <span className="rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs font-medium capitalize text-slate-700">{item.issueType.replace(/_/g, " ")}</span>
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
                  <div className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    <MapPin className="h-3.5 w-3.5" aria-hidden="true" /> Street address
                  </div>
                  <div className="text-sm font-medium text-slate-900 dark:text-slate-100">{item.street || "N/A"}</div>
                </div>
                <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
                  <div className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    <Landmark className="h-3.5 w-3.5" aria-hidden="true" /> Landmark
                  </div>
                  <div className="text-sm font-medium text-slate-900 dark:text-slate-100">{item.landmark || "N/A"}</div>
                </div>
              </div>

              {item.description && (
                <div>
                  <h4 className="mb-1 text-sm font-semibold text-slate-900 dark:text-slate-100">Description</h4>
                  <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700 dark:text-slate-300">{item.description}</p>
                </div>
              )}

              {(item.createdAt || item.meta?.length) && (
                <dl className="grid gap-2 rounded-xl bg-slate-50 p-3 text-sm dark:bg-slate-900">
                  {item.createdAt && (
                    <div className="flex justify-between gap-4">
                      <dt className="flex items-center gap-1.5 text-slate-600"><Calendar className="h-3.5 w-3.5" aria-hidden="true" /> Submitted</dt>
                      <dd className="text-right font-medium text-slate-900 dark:text-slate-100">{formatPhDate(item.createdAt)}</dd>
                    </div>
                  )}
                  {item.meta?.map((row) => (
                    <div key={row.label} className="flex justify-between gap-4">
                      <dt className="text-slate-600">{row.label}</dt>
                      <dd className="text-right font-medium text-slate-900 dark:text-slate-100">{row.value}</dd>
                    </div>
                  ))}
                </dl>
              )}

              <ReportMediaGallery
                title="Reporter Uploaded Images"
                images={(item.photos || []).map((url, i) => ({ url, alt: `${item.title} image ${i + 1}` }))}
                emptyText="No images uploaded for this report."
              />
              {!!item.completionPhotos?.length && (
                <ReportMediaGallery
                  title="Completion Proof"
                  images={item.completionPhotos.map((url, i) => ({ url, alt: `Completion proof ${i + 1}` }))}
                  emptyText="No completion proof submitted yet."
                />
              )}

              {point && point.precision !== "street" && point.precision !== "exact" && (
                <p className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  The street couldn&apos;t be matched on OpenStreetMap, so this pin marks the {point.precision === "barangay" ? "barangay" : "city"} center. Use the street address and landmark above on site.
                </p>
              )}
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-slate-100 p-4 sm:flex-row sm:justify-between dark:border-slate-800">
              {point ? (
                <Button asChild variant="outline" className="rounded-lg">
                  <a
                    href={`https://www.openstreetmap.org/directions?to=${point.lat}%2C${point.lng}#map=17/${point.lat}/${point.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Navigation className="mr-1.5 h-4 w-4" aria-hidden="true" /> Directions
                  </a>
                </Button>
              ) : (
                <span />
              )}
              {link && (
                <Button asChild className="rounded-lg bg-slate-900 text-white hover:bg-slate-800">
                  <Link href={link.href}>
                    {link.label} <ExternalLink className="ml-1.5 h-4 w-4" aria-hidden="true" />
                  </Link>
                </Button>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

/**
 * Google-Maps-style view of reports/tasks: a full-screen OpenStreetMap (Leaflet, no API key)
 * with a resizable list pane on the left (desktop) or a draggable bottom sheet (mobile).
 * Clicking a pin opens the record's details; clicking a list card flies to its pin.
 */
export function IssuesMapView({
  title,
  subtitle,
  items,
  isLoading,
  error,
  filters,
  activeFilter,
  onFilterChange,
  toolbar,
  legend,
  page,
  totalPages,
  total,
  onPageChange,
  onRefresh,
  isRefreshing,
  detailsLink,
  emptyText = "Nothing to show for this filter.",
  noun = "items",
}: IssuesMapViewProps) {
  const desktop = useIsDesktop();
  const viewportH = useViewportHeight();
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  // --- desktop pane: resizable + collapsible ------------------------------------------------
  const [paneWidth, setPaneWidth] = useState(400);
  const [paneOpen, setPaneOpen] = useState(true);
  useEffect(() => {
    try {
      const saved = Number(localStorage.getItem(PANE_WIDTH_KEY));
      if (saved >= PANE_MIN && saved <= PANE_MAX) setPaneWidth(saved);
    } catch {}
  }, []);
  const startResize = (e: ReactPointerEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startW = paneWidth;
    let latest = startW;
    const max = Math.min(PANE_MAX, window.innerWidth * 0.6);
    const move = (ev: PointerEvent) => {
      latest = Math.round(Math.min(max, Math.max(PANE_MIN, startW + ev.clientX - startX)));
      setPaneWidth(latest);
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      try { localStorage.setItem(PANE_WIDTH_KEY, String(latest)); } catch {}
    };
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };
  const resizeByKey = (e: ReactKeyboardEvent) => {
    const step = e.shiftKey ? 48 : 16;
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    setPaneWidth((w) => {
      const next = Math.min(PANE_MAX, Math.max(PANE_MIN, w + (e.key === "ArrowRight" ? step : -step)));
      try { localStorage.setItem(PANE_WIDTH_KEY, String(next)); } catch {}
      return next;
    });
  };

  // --- mobile sheet: draggable with three snap points ---------------------------------------
  const [snap, setSnap] = useState<SheetSnap>("half");
  const [dragHeight, setDragHeight] = useState<number | null>(null);
  const snapHeights = useMemo(
    () => ({ peek: DOCK_SPACE + SHEET_HEADER, half: Math.round(viewportH * 0.5), full: viewportH - 120 }),
    [viewportH]
  );
  const sheetHeight = dragHeight ?? snapHeights[snap];
  const dragStart = useRef<{ y: number; h: number; t: number; moved: boolean } | null>(null);
  const onSheetPointerDown = (e: ReactPointerEvent) => {
    dragStart.current = { y: e.clientY, h: sheetHeight, t: Date.now(), moved: false };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onSheetPointerMove = (e: ReactPointerEvent) => {
    const s = dragStart.current;
    if (!s) return;
    const dy = s.y - e.clientY;
    if (Math.abs(dy) > 4) s.moved = true;
    if (s.moved) setDragHeight(Math.min(snapHeights.full, Math.max(snapHeights.peek, s.h + dy)));
  };
  const onSheetPointerUp = (e: ReactPointerEvent) => {
    const s = dragStart.current;
    dragStart.current = null;
    if (!s) return;
    if (!s.moved) {
      // Tap on the handle: cycle up, or drop back to peek from full.
      setSnap((cur) => (cur === "peek" ? "half" : cur === "half" ? "full" : "peek"));
      setDragHeight(null);
      return;
    }
    const h = s.h + (s.y - e.clientY);
    const velocity = (s.y - e.clientY) / Math.max(1, Date.now() - s.t); // px/ms, + = up
    const order: SheetSnap[] = ["peek", "half", "full"];
    let next = order.reduce((best, k) => (Math.abs(snapHeights[k] - h) < Math.abs(snapHeights[best] - h) ? k : best), "half" as SheetSnap);
    if (Math.abs(velocity) > 0.5) {
      const i = order.indexOf(snap);
      next = order[Math.min(2, Math.max(0, i + (velocity > 0 ? 1 : -1)))];
    }
    setSnap(next);
    setDragHeight(null);
  };

  // --- data ----------------------------------------------------------------------------------
  const visibleItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((i) =>
      [i.id, i.reportId, i.title, i.street, i.barangay, i.municipality, i.landmark, i.issueType]
        .some((v) => v && v.toLowerCase().includes(q))
    );
  }, [items, query]);
  const { pinned, pending, unplaced } = usePinnedItems(visibleItems);

  useEffect(() => {
    if (selectedId && !visibleItems.some((i) => i.id === selectedId)) setSelectedId(null);
  }, [visibleItems, selectedId]);

  const selectFromList = useCallback(
    (id: string) => {
      setSelectedId(id);
      if (!desktop) setSnap("peek");
    },
    [desktop]
  );
  const openItem = pinned.find((i) => i.id === openId) ?? null;

  const padding: MapPadding = desktop
    ? { top: 16, right: 56, bottom: 48, left: paneOpen ? paneWidth + 32 : 16 }
    : { top: 120, right: 16, bottom: sheetHeight, left: 16 };

  // --- shared pieces -------------------------------------------------------------------------
  const searchBox = (
    <label className="relative flex min-w-0 flex-1 items-center">
      <span className="sr-only">Search reports</span>
      <Search className="pointer-events-none absolute left-3 h-4 w-4 text-slate-500" aria-hidden="true" />
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search barangay, street, or ID…"
        className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-8 text-sm text-slate-900 placeholder:text-slate-500 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
      />
      {query && (
        <button type="button" onClick={() => setQuery("")} className="absolute right-2 rounded p-1 text-slate-500 hover:text-slate-900" aria-label="Clear search">
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </label>
  );

  const filterChips = (
    <div className="flex gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none]" role="tablist" aria-label="Filter by status">
      {filters.map((f) => {
        const active = f.value === activeFilter;
        return (
          <button
            key={f.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => { onFilterChange(f.value); setSelectedId(null); }}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
              active
                ? "border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
            }`}
          >
            {f.label}
            {f.count !== undefined && (
              <span className={`rounded-full px-1.5 text-[10px] leading-4 ${active ? "bg-white/20" : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"}`}>{f.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );

  const listBody = (
    <>
      {error ? (
        <div className="m-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center text-sm text-slate-600" role="alert">{error}</div>
      ) : isLoading ? (
        <ul className="space-y-2.5 p-3" aria-busy="true">
          {Array.from({ length: 4 }).map((_, i) => (
            <li key={i} className="h-[118px] animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
          ))}
        </ul>
      ) : visibleItems.length === 0 ? (
        <div className="m-3 flex flex-col items-center rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center dark:border-slate-700 dark:bg-slate-900">
          <MapPin className="mb-2 h-8 w-8 text-slate-500" aria-hidden="true" />
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{query ? "No matches" : "No pins"}</p>
          <p className="mt-1 text-xs text-slate-600">{query ? `Nothing on this page matches “${query}”.` : emptyText}</p>
        </div>
      ) : (
        <ul className="space-y-2.5 p-3">
          {pinned.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              selected={item.id === selectedId}
              onSelect={() => selectFromList(item.id)}
              onOpen={() => { setSelectedId(item.id); setOpenId(item.id); }}
            />
          ))}
        </ul>
      )}
      {!!totalPages && totalPages > 1 && onPageChange && (
        <div className="flex items-center justify-between px-3 pb-3 text-xs text-slate-600">
          <Button variant="outline" size="sm" className="h-8 rounded-lg" disabled={!page || page <= 1} onClick={() => onPageChange((page || 1) - 1)}>
            <ChevronLeft className="h-4 w-4" aria-hidden="true" /> Prev
          </Button>
          <span>Page {page} of {totalPages}</span>
          <Button variant="outline" size="sm" className="h-8 rounded-lg" disabled={!page || page >= totalPages} onClick={() => onPageChange((page || 1) + 1)}>
            Next <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      )}
    </>
  );

  const geoStatus =
    pending > 0 ? (
      <span className="flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" /> Locating {pending} on the map…</span>
    ) : unplaced > 0 ? (
      <span>{unplaced} couldn&apos;t be placed on the map</span>
    ) : null;

  const countLine = (
    <span>
      {total !== undefined ? `${total} total` : `${visibleItems.length} shown`}
      {totalPages && totalPages > 1 ? ` · showing ${items.length}` : ""}
    </span>
  );

  const legendEl = (
    <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-white/95 px-3 py-1.5 text-[11px] font-semibold text-slate-700 shadow-md backdrop-blur dark:border-slate-700 dark:bg-slate-900/95 dark:text-slate-200">
      {legend.map((tone) => (
        <span key={tone} className="flex items-center gap-1.5">
          <span className={`h-2 w-2 rounded-full ${TONE_STYLES[tone].dot}`} aria-hidden="true" />
          {TONE_STYLES[tone].label}
        </span>
      ))}
    </div>
  );

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-slate-100 dark:bg-slate-950">
      {/* Map (own stacking context so Leaflet's z-indices stay below the pane, sheet and dialogs) */}
      <div className="absolute inset-0 isolate z-0">
        <LeafletMap
          items={pinned}
          selectedId={selectedId}
          onSelect={(id) => { setSelectedId(id); setOpenId(id); }}
          padding={padding}
          zoomControl={desktop}
        />
      </div>

      {desktop ? (
        <>
          {/* Desktop: floating, resizable list pane */}
          <aside
            className={`absolute bottom-28 left-4 top-4 z-10 flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl transition-transform duration-200 dark:border-slate-800 dark:bg-slate-950 ${paneOpen ? "" : "-translate-x-[calc(100%+1rem)]"}`}
            style={{ width: paneWidth }}
            aria-label={`${title} list`}
          >
            <div className="border-b border-slate-100 p-4 pb-3 dark:border-slate-800">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h1 className="truncate text-base font-bold text-slate-900 dark:text-slate-100">{title}</h1>
                  {subtitle && <p className="truncate text-xs text-slate-600 dark:text-slate-400">{subtitle}</p>}
                </div>
                {onRefresh && (
                  <button type="button" onClick={onRefresh} className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900" aria-label="Refresh">
                    <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                  </button>
                )}
              </div>
              <div className="mt-3 flex gap-2">{searchBox}{toolbar}</div>
              <div className="mt-3">{filterChips}</div>
              <div className="mt-2 flex items-center justify-between gap-2 text-[11px] text-slate-500">{countLine}{geoStatus}</div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{listBody}</div>

            {/* Resize handle */}
            <div
              role="separator"
              aria-orientation="vertical"
              aria-label="Resize list"
              aria-valuemin={PANE_MIN}
              aria-valuemax={PANE_MAX}
              aria-valuenow={paneWidth}
              tabIndex={0}
              onPointerDown={startResize}
              onKeyDown={resizeByKey}
              className="group absolute inset-y-0 right-0 w-2 cursor-col-resize focus-visible:outline-none"
            >
              <span className="absolute inset-y-0 right-0 w-0.5 bg-transparent transition-colors group-hover:bg-primary group-focus-visible:bg-primary" />
            </div>
          </aside>

          {/* Collapse / expand tab */}
          <button
            type="button"
            onClick={() => setPaneOpen((o) => !o)}
            className="absolute top-1/2 z-10 flex h-12 w-6 -translate-y-1/2 items-center justify-center rounded-r-lg border border-l-0 border-slate-200 bg-white text-slate-600 shadow-md transition-[left] duration-200 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900"
            style={{ left: paneOpen ? paneWidth + 16 : 0 }}
            aria-label={paneOpen ? "Hide list" : "Show list"}
            aria-expanded={paneOpen}
          >
            {paneOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>

          <div className="absolute bottom-28 right-4 z-10">{legendEl}</div>
        </>
      ) : (
        <>
          {/* Mobile: floating search + filters */}
          <div className="absolute inset-x-3 top-3 z-10 space-y-2">
            <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/95 p-1.5 shadow-lg backdrop-blur dark:border-slate-700 dark:bg-slate-900/95">
              {searchBox}
              {toolbar}
              {onRefresh && (
                <button type="button" onClick={onRefresh} className="rounded-lg p-2 text-slate-600 hover:text-slate-900" aria-label="Refresh">
                  <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                </button>
              )}
            </div>
            <div className="pr-12">{filterChips}</div>
          </div>

          {sheetHeight < viewportH * 0.6 && (
            <div className="absolute inset-x-0 z-10 flex justify-center px-3 transition-[bottom] duration-200" style={{ bottom: sheetHeight + 12 }}>
              {legendEl}
            </div>
          )}

          {/* Mobile: draggable bottom sheet */}
          <section
            className={`absolute inset-x-0 bottom-0 z-20 flex flex-col rounded-t-3xl border-t border-slate-200 bg-white shadow-[0_-8px_30px_rgba(15,23,42,0.15)] dark:border-slate-800 dark:bg-slate-950 ${dragHeight === null ? "transition-[height] duration-300 ease-out" : ""}`}
            style={{ height: sheetHeight }}
            aria-label={`${title} list`}
          >
            <div
              className="shrink-0 cursor-grab touch-none select-none px-4 pb-2 pt-2.5 active:cursor-grabbing"
              onPointerDown={onSheetPointerDown}
              onPointerMove={onSheetPointerMove}
              onPointerUp={onSheetPointerUp}
              onPointerCancel={onSheetPointerUp}
            >
              <div className="mx-auto mb-2.5 h-1.5 w-10 rounded-full bg-slate-300" aria-hidden="true" />
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <h1 className="truncate text-sm font-bold text-slate-900 dark:text-slate-100">
                    {isLoading ? title : `${visibleItems.length} ${noun}`}
                  </h1>
                  <div className="text-[11px] text-slate-500">{geoStatus ?? countLine}</div>
                </div>
                <button
                  type="button"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={() => setSnap((s) => (s === "full" ? "peek" : "full"))}
                  className="flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-slate-600"
                  aria-label={snap === "full" ? "Collapse list" : "Expand list"}
                >
                  {snap === "full" ? <>Show map <ChevronDown className="h-4 w-4" /></> : <>Swipe up for list <ChevronUp className="h-4 w-4" /></>}
                </button>
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain border-t border-slate-100 pb-28 dark:border-slate-800">
              {listBody}
            </div>
          </section>
        </>
      )}

      <DetailsModal item={openItem} onClose={() => setOpenId(null)} detailsLink={detailsLink} />
    </div>
  );
}

