"use client";

import { MarkerClusterer } from "@googlemaps/markerclusterer";
import { APIProvider, Map, useMap } from "@vis.gl/react-google-maps";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AdminFiltersToolbar } from "@/src/features/admin/components/admin-filters-toolbar";
import { buildCategoryPinIcon } from "@/src/features/admin-list/utils/category-map-pin";
import { MapZoomModeSync } from "@/src/features/maps/components/map-zoom-mode-sync";
import { DEFAULT_MAP_CENTER } from "@/src/features/maps/constants/default-map-center";
import { DEFAULT_GOOGLE_MAP_ID } from "@/src/features/maps/constants/map-id";
import { adminClusterRenderer } from "@/src/features/maps/services/cluster-renderer.service";
import {
  diffVisibleMarkers,
  findVisibleMarkerIds,
} from "@/src/features/maps/services/marker-visibility.service";
import { openAdminRequestInfoWindow } from "@/src/features/maps/services/admin-request-infowindow.service";
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

const clusterZoomThreshold = 15;

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
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
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

    const markers = markersRef.current;
    const previousVisibleIds = visibleMarkerIdsRef.current;
    const nextVisibleIds = findVisibleMarkerIds(markers, bounds);
    const { addedMarkers, removedMarkers } = diffVisibleMarkers(
      markers,
      previousVisibleIds,
      nextVisibleIds
    );

    if (clusterModeEnabledRef.current) {
      if (!clustererRef.current) {
        clustererRef.current = new MarkerClusterer({
          map,
          markers: [],
          renderer: adminClusterRenderer,
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
    infoWindowRef.current?.close();
    markersRef.current.forEach((marker) => {
      google.maps.event.clearInstanceListeners(marker);
      marker.setMap(null);
    });
    markersRef.current.clear();
    visibleMarkerIdsRef.current = new Set();

    const markerEntries = requests
      .filter(
        (item) => Number.isFinite(item.latitude) && Number.isFinite(item.longitude)
      )
      .map(
        (item) => {
          const marker = new google.maps.Marker({
            position: {
              lat: item.latitude,
              lng: item.longitude,
            },
            title: item.title,
            icon: {
              url: buildCategoryPinIcon(item.category),
              scaledSize: new google.maps.Size(48, 48),
            },
          });

          marker.addListener("click", () => {
            if (!map) return;
            if (!infoWindowRef.current) {
              infoWindowRef.current = new google.maps.InfoWindow();
            }

            openAdminRequestInfoWindow({
              infoWindow: infoWindowRef.current,
              marker,
              map,
              request: item,
            });
          });

          return [item.id, marker] as const;
        }
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
      markers.forEach((marker) => {
        google.maps.event.clearInstanceListeners(marker);
        marker.setMap(null);
      });
      infoWindowRef.current?.close();
      markersRef.current.clear();
      visibleMarkerIdsRef.current = new Set();
    };
  }, [clearClusterer, map, requests, syncVisibleMarkers]);

  useEffect(() => {
    if (!map) return;

    const mapClickListener = map.addListener("click", () => {
      infoWindowRef.current?.close();
    });

    const onDocumentPointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) {
        infoWindowRef.current?.close();
        return;
      }

      const clickedInsideInfoWindow = Boolean(
        target.closest(".gm-style-iw") || target.closest(".gm-style-iw-c")
      );

      if (!clickedInsideInfoWindow) {
        infoWindowRef.current?.close();
      }
    };

    document.addEventListener("pointerdown", onDocumentPointerDown, true);

    return () => {
      mapClickListener.remove();
      document.removeEventListener("pointerdown", onDocumentPointerDown, true);
    };
  }, [map]);

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

      <AdminFiltersToolbar
        title="Painel Administrativo - Mapa"
        subtitle={subtitle}
        searchInput={searchInput}
        onSearchInputChange={setSearchInput}
        categoryFilter={categoryFilter}
        onCategoryFilterChange={setCategoryFilter}
        priorityFilter={priorityFilter}
        onPriorityFilterChange={setPriorityFilter}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={clearFilters}
        navHref="/admin-list"
        navLabel="Ver lista"
        navIcon="list"
      />

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
                  defaultCenter={DEFAULT_MAP_CENTER}
                  defaultZoom={11}
                  mapId={DEFAULT_GOOGLE_MAP_ID}
                  gestureHandling="greedy"
                  style={{ width: "100%", height: "100%" }}
                >
                  <MapZoomModeSync
                    onModeChange={setClusterModeEnabled}
                    resolveModeForZoom={(zoom) =>
                      isClusterModeEnabledForZoom(zoom, clusterZoomThreshold)
                    }
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
