"use client";

import Link from "next/link";
import { MarkerClusterer, type Renderer } from "@googlemaps/markerclusterer";
import { APIProvider, Map, useMap } from "@vis.gl/react-google-maps";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  categoryOptions,
  priorityOptions,
  statusOptions,
} from "@/src/features/admin-list/constants/request-filters";
import { buildCategoryPinIcon } from "@/src/features/admin-list/utils/category-map-pin";
import { env } from "@/src/lib/env";
import type { AdminRequest, RequestStatus } from "@/src/types/request";
import { listAllRequests } from "../services/list-all-requests";
import { isClusterModeEnabledForZoom } from "../utils/cluster-mode";

type ToastItem = {
  id: number;
  type: "success" | "error";
  title: string;
  description: string;
};

const defaultCenter = { lat: -23.55052, lng: -46.633308 };
const clusterZoomThreshold = 15;
const clusterIconCache = new globalThis.Map<string, string>();

type ClusterStyle = {
  size: number;
  bgColor: string;
  borderColor: string;
  textColor: string;
};

function resolveClusterStyle(count: number): ClusterStyle {
  if (count >= 50) {
    return {
      size: 54,
      bgColor: "#0c6fdb",
      borderColor: "#095db9",
      textColor: "#ffffff",
    };
  }

  if (count >= 10) {
    return {
      size: 48,
      bgColor: "#93c5fd",
      borderColor: "#0c6fdb",
      textColor: "#123f84",
    };
  }

  return {
    size: 42,
    bgColor: "#dbeafe",
    borderColor: "#60a5fa",
    textColor: "#1e3a8a",
  };
}

function getClusterIconUrl(count: number, style: ClusterStyle): string {
  const fontSize = count >= 100 ? 13 : 14;
  const cacheKey = `${count}-${style.size}-${style.bgColor}-${style.borderColor}-${style.textColor}`;
  const cached = clusterIconCache.get(cacheKey);
  if (cached) return cached;

  const center = style.size / 2;
  const radius = center - 2;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${style.size}" height="${style.size}" viewBox="0 0 ${style.size} ${style.size}">
      <circle cx="${center}" cy="${center}" r="${radius}" fill="${style.bgColor}" stroke="${style.borderColor}" stroke-width="3" />
      <text x="50%" y="50%" text-anchor="middle" dominant-baseline="central" fill="${style.textColor}" font-family="Roboto, Arial, sans-serif" font-size="${fontSize}" font-weight="700">${count}</text>
    </svg>
  `;

  const url = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  clusterIconCache.set(cacheKey, url);
  return url;
}

const clusterRenderer: Renderer = {
  render: ({ count, position }) => {
    const style = resolveClusterStyle(count);
    const maxZIndex = (google.maps.Marker.MAX_ZINDEX ?? 100000) as number;

    return new google.maps.Marker({
      position,
      icon: {
        url: getClusterIconUrl(count, style),
        scaledSize: new google.maps.Size(style.size, style.size),
      },
      zIndex: maxZIndex + count,
    });
  },
};

function MapZoomModeSync({
  threshold,
  onModeChange,
}: {
  threshold: number;
  onModeChange: (nextClusterMode: boolean) => void;
}) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    const syncClusterMode = () => {
      const zoom = map.getZoom() ?? 0;
      onModeChange(isClusterModeEnabledForZoom(zoom, threshold));
    };

    syncClusterMode();
    const listener = map.addListener("zoom_changed", syncClusterMode);

    return () => {
      listener.remove();
    };
  }, [map, onModeChange, threshold]);

  return null;
}

function RequestMarkerLayer({
  requests,
  clusterModeEnabled,
}: {
  requests: AdminRequest[];
  clusterModeEnabled: boolean;
}) {
  const map = useMap();
  const markersRef = useRef<globalThis.Map<string, google.maps.Marker>>(
    new globalThis.Map()
  );
  const clustererRef = useRef<MarkerClusterer | null>(null);
  const visibleMarkerIdsRef = useRef<Set<string>>(new Set());
  const rafRef = useRef<number | null>(null);
  const clusterModeEnabledRef = useRef(clusterModeEnabled);

  useEffect(() => {
    clusterModeEnabledRef.current = clusterModeEnabled;
  }, [clusterModeEnabled]);

  const clearClusterer = useCallback(() => {
    const activeClusterer = clustererRef.current;
    if (!activeClusterer) return;
    activeClusterer.clearMarkers();
    activeClusterer.setMap(null);
    clustererRef.current = null;
  }, []);

  const syncVisibleMarkers = useCallback(() => {
    if (!map) return;
    const bounds = map.getBounds();
    if (!bounds) return;

    const nextVisibleIds = new Set<string>();
    const addedMarkers: google.maps.Marker[] = [];
    const removedMarkers: google.maps.Marker[] = [];
    const markers = markersRef.current;
    const previousVisibleIds = visibleMarkerIdsRef.current;

    markers.forEach((marker, id) => {
      const position = marker.getPosition();
      if (!position) return;
      if (bounds.contains(position)) {
        nextVisibleIds.add(id);
      }
    });

    previousVisibleIds.forEach((id) => {
      if (!nextVisibleIds.has(id)) {
        const marker = markers.get(id);
        if (marker) removedMarkers.push(marker);
      }
    });

    nextVisibleIds.forEach((id) => {
      if (!previousVisibleIds.has(id)) {
        const marker = markers.get(id);
        if (marker) addedMarkers.push(marker);
      }
    });

    if (clusterModeEnabledRef.current) {
      if (!clustererRef.current) {
        clustererRef.current = new MarkerClusterer({
          map,
          markers: [],
          renderer: clusterRenderer,
        });
      }

      if (removedMarkers.length > 0) {
        clustererRef.current.removeMarkers(removedMarkers, true);
      }
      if (addedMarkers.length > 0) {
        clustererRef.current.addMarkers(addedMarkers, true);
      }
      if (removedMarkers.length > 0 || addedMarkers.length > 0) {
        clustererRef.current.render();
      }
    } else {
      removedMarkers.forEach((marker) => marker.setMap(null));
      addedMarkers.forEach((marker) => marker.setMap(map));
    }

    visibleMarkerIdsRef.current = nextVisibleIds;
  }, [map]);

  useEffect(() => {
    if (!map || typeof window === "undefined" || !window.google?.maps) return;

    clearClusterer();
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current.clear();
    visibleMarkerIdsRef.current = new Set();

    const markerEntries = requests
      .filter(
        (item) => Number.isFinite(item.latitude) && Number.isFinite(item.longitude)
      )
      .map(
        (item) =>
          [
            item.id,
            new google.maps.Marker({
              position: {
                lat: item.latitude,
                lng: item.longitude,
              },
              title: item.title,
              icon: {
                url: buildCategoryPinIcon(item.category),
                scaledSize: new google.maps.Size(48, 48),
              },
            }),
          ] as const
      );

    markersRef.current = new globalThis.Map(markerEntries);
    const markers = Array.from(markersRef.current.values());

    if (markers.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      markers.forEach((marker) => {
        const position = marker.getPosition();
        if (position) bounds.extend(position);
      });
      map.fitBounds(bounds, 72);
      if (markers.length === 1) map.setZoom(16);
    }

    syncVisibleMarkers();

    return () => {
      clearClusterer();
      markers.forEach((marker) => marker.setMap(null));
      markersRef.current.clear();
      visibleMarkerIdsRef.current = new Set();
    };
  }, [clearClusterer, map, requests, syncVisibleMarkers]);

  useEffect(() => {
    if (!map) return;
    if (markersRef.current.size === 0) return;

    if (rafRef.current !== null) {
      window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    clearClusterer();
    markersRef.current.forEach((marker) => marker.setMap(null));
    visibleMarkerIdsRef.current = new Set();
    syncVisibleMarkers();

    if (clusterModeEnabled) {
      const listener = map.addListener("idle", syncVisibleMarkers);
      return () => listener.remove();
    }

    const listener = map.addListener("bounds_changed", () => {
      if (rafRef.current !== null) return;
      rafRef.current = window.requestAnimationFrame(() => {
        rafRef.current = null;
        syncVisibleMarkers();
      });
    });

    return () => {
      listener.remove();
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [clearClusterer, clusterModeEnabled, map, syncVisibleMarkers]);

  return null;
}

export function AdminRequestMap() {
  const [items, setItems] = useState<AdminRequest[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [clusterModeEnabled, setClusterModeEnabled] = useState(true);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<RequestStatus | "">("Pendente");

  const hasActiveFilters = Boolean(
    searchInput.trim() ||
      categoryFilter ||
      priorityFilter ||
      statusFilter !== "Pendente"
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput);
    }, 750);

    return () => window.clearTimeout(timer);
  }, [searchInput]);

  function pushToast(
    type: ToastItem["type"],
    title: string,
    description: string
  ) {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((prev) => [...prev, { id, type, title, description }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 3200);
  }

  useEffect(() => {
    let isActive = true;

    async function loadAll() {
      setLoading(true);
      try {
        const response = await listAllRequests({
          search: search.trim() || undefined,
          category: categoryFilter || undefined,
          priority: priorityFilter || undefined,
          status: statusFilter || undefined,
        });

        if (!isActive) return;
        setItems(response.data);
        setTotal(response.total);
      } catch (error) {
        if (!isActive) return;
        const message =
          error instanceof Error
            ? error.message
            : "Erro ao carregar solicitacoes no mapa.";
        pushToast("error", "Falha ao carregar mapa", message);
      } finally {
        if (isActive) setLoading(false);
      }
    }

    void loadAll();

    return () => {
      isActive = false;
    };
  }, [categoryFilter, priorityFilter, search, statusFilter]);

  const subtitle = useMemo(() => {
    if (loading) return "Carregando solicitacoes do mapa...";
    return `Mostrando ${items.length} de ${total} chamados no mapa`;
  }, [items.length, loading, total]);

  function clearFilters() {
    setSearchInput("");
    setSearch("");
    setCategoryFilter("");
    setPriorityFilter("");
    setStatusFilter("Pendente");
  }

  return (
    <div className="admin-root admin-map-root">
      {loading ? (
        <div className="admin-loading-overlay" role="status" aria-live="polite">
          <div className="admin-loading-card">Carregando...</div>
        </div>
      ) : null}

      <div className="toast-stack">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`toast-item ${
              toast.type === "success" ? "toast-success" : "toast-error"
            }`}
          >
            <strong>{toast.title}</strong>
            <p>{toast.description}</p>
          </div>
        ))}
      </div>

      <section className="admin-toolbar">
        <div className="admin-toolbar-rows">
          <div className="admin-toolbar-row">
            <div className="admin-toolbar-heading">
              <div>
                <h2>Painel Administrativo - Mapa</h2>
                <p className="admin-toolbar-sub">{subtitle}</p>
              </div>
            </div>
            <div className="admin-toolbar-right">
              <input
                className="admin-toolbar-search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder={"Buscar por endere\u00e7o"}
              />
              <Link href="/admin-list" className="admin-nav-btn">
                <svg
                  className="admin-nav-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    d="M4 6.5h16M4 12h16M4 17.5h16"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
                Ver lista
              </Link>
            </div>
          </div>

          <div className="admin-toolbar-row">
            <span className="admin-filter-label">Filtrar por:</span>
            <div className="admin-toolbar-filter-group">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="">Categoria: Todas</option>
                {categoryOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>

              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
              >
                <option value="">Prioridade: Todas</option>
                {priorityOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as RequestStatus | "")}
              >
                <option value="">Status: Todos</option>
                {statusOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>

              {hasActiveFilters ? (
                <button type="button" className="admin-clear-link" onClick={clearFilters}>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <path
                      d="M18 6L6 18M6 6l12 12"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                  </svg>
                  Limpar filtros
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className="admin-map-panel">
        {!env.googleMapsApiKey ? (
          <p className="notice">
            Configure NEXT_PUBLIC_GOOGLE_MAPS_API_KEY para exibir o mapa.
          </p>
        ) : (
          <>
            <div className="admin-map-canvas">
              <APIProvider apiKey={env.googleMapsApiKey}>
                <Map
                  defaultCenter={defaultCenter}
                  defaultZoom={11}
                  gestureHandling="greedy"
                  style={{ width: "100%", height: "100%" }}
                >
                  <MapZoomModeSync
                    threshold={clusterZoomThreshold}
                    onModeChange={setClusterModeEnabled}
                  />
                  <RequestMarkerLayer
                    requests={items}
                    clusterModeEnabled={clusterModeEnabled}
                  />
                </Map>
              </APIProvider>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
