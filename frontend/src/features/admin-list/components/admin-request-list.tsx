"use client";

import { APIProvider, Map, Marker } from "@vis.gl/react-google-maps";
import { useEffect, useMemo, useState } from "react";
import { AdminFiltersToolbar } from "@/src/features/admin/components/admin-filters-toolbar";
import { MapAutoRecenter } from "@/src/features/maps/components/map-auto-recenter";
import { DEFAULT_GOOGLE_MAP_ID } from "@/src/features/maps/constants/map-id";
import { env } from "@/src/lib/env";
import type { AdminRequest, RequestStatus } from "@/src/types/request";
import { statusOptions } from "../constants/request-filters";
import { listRequests } from "../services/list-requests";
import { updateRequestStatus } from "../services/update-request-status";
import { buildCategoryPinIcon } from "../utils/category-map-pin";

type ToastItem = {
  id: number;
  type: "success" | "error";
  title: string;
  description: string;
};

const pageSize = 12;

function formatRelativeDate(isoDate: string): string {
  const createdAt = new Date(isoDate).getTime();
  const now = Date.now();
  const diffMs = now - createdAt;

  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diffMs < hour) {
    const minutes = Math.max(1, Math.floor(diffMs / minute));
    return `Há ${minutes} min`;
  }

  if (diffMs < day) {
    const hours = Math.floor(diffMs / hour);
    return `Há ${hours} h`;
  }

  return new Date(isoDate).toLocaleDateString("pt-BR");
}

export function AdminRequestList() {
  const [items, setItems] = useState<AdminRequest[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<RequestStatus | "">("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const hasActiveFilters = Boolean(
    searchInput.trim() || categoryFilter || priorityFilter || statusFilter
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
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
    async function load() {
      setLoading(true);
      try {
        const response = await listRequests({
          page,
          limit: pageSize,
          search: search.trim() || undefined,
          category: categoryFilter || undefined,
          priority: priorityFilter || undefined,
          status: statusFilter || undefined,
        });

        setItems(response.data);
        setTotal(response.pagination.total);
        setTotalPages(response.pagination.totalPages);

        setSelectedId((currentSelectedId) => {
          if (response.data.some((item) => item.id === currentSelectedId)) {
            return currentSelectedId;
          }
          return response.data[0]?.id ?? null;
        });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Erro ao carregar solicitações.";
        pushToast("error", "Falha ao carregar lista", message);
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [page, search, categoryFilter, priorityFilter, statusFilter]);

  const selected = useMemo(
    () => items.find((item) => item.id === selectedId) ?? null,
    [items, selectedId]
  );

  async function handleStatusChange(id: string, nextStatus: RequestStatus) {
    try {
      const updated = await updateRequestStatus(id, nextStatus);
      setItems((prev) => prev.map((item) => (item.id === id ? updated : item)));
      pushToast(
        "success",
        "Status atualizado",
        `O chamado foi marcado como "${nextStatus}".`
      );
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Erro ao atualizar status da solicitação.";
      pushToast("error", "Falha ao atualizar status", message);
    }
  }

  function clearFilters() {
    setSearchInput("");
    setSearch("");
    setCategoryFilter("");
    setPriorityFilter("");
    setStatusFilter("");
    setPage(1);
  }

  return (
    <div className="admin-root">
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
        title="Painel Administrativo"
        subtitle={`Mostrando ${items.length} de ${total} chamados`}
        searchInput={searchInput}
        onSearchInputChange={setSearchInput}
        categoryFilter={categoryFilter}
        onCategoryFilterChange={(value) => {
          setCategoryFilter(value);
          setPage(1);
        }}
        priorityFilter={priorityFilter}
        onPriorityFilterChange={(value) => {
          setPriorityFilter(value);
          setPage(1);
        }}
        statusFilter={statusFilter}
        onStatusFilterChange={(value) => {
          setStatusFilter(value);
          setPage(1);
        }}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={clearFilters}
        navHref="/admin-list/map"
        navLabel="Abrir mapa completo"
        navIcon="map"
      />

      <div className="admin-layout">
        <section className="admin-list-panel">
          <div className="admin-list">
            {!loading && items.length === 0 ? (
              <p className="admin-empty">Nenhum chamado encontrado.</p>
            ) : null}

            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`admin-item ${
                  item.id === selectedId ? "is-selected" : ""
                }`}
                onClick={() => setSelectedId(item.id)}
              >
                <div className="admin-item-head">
                  <strong>{item.title}</strong>
                  <span>{formatRelativeDate(item.createdAt)}</span>
                </div>

                <div className="admin-badges">
                  <span
                    className={`badge badge-priority-${item.priority
                      .normalize("NFD")
                      .replace(/[\u0300-\u036f]/g, "")
                      .toLowerCase()}`}
                  >
                    {item.priority}
                  </span>
                  <span className="badge badge-status">{item.status}</span>
                </div>
              </button>
            ))}
          </div>

          <div className="admin-pagination">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            >
              {"< Anterior"}
            </button>
            <span>
              Página {page} de {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            >
              {"Próxima >"}
            </button>
          </div>
        </section>

        <section className="admin-detail">
          {selected ? (
            <>
              <div className="admin-detail-top">
                <div className="admin-detail-title-row">
                  <h1>{selected.title}</h1>
                  <div className="admin-status-segmented" aria-label="Mudar Status">
                    {statusOptions.map((option) => (
                      <button
                        key={option}
                        type="button"
                        className={`admin-status-btn ${
                          selected.status === option ? "is-active" : ""
                        } ${
                          option === "Pendente"
                            ? "status-pendente"
                            : option === "Resolvida"
                              ? "status-resolvida"
                              : "status-cancelada"
                        }`}
                        onClick={() => {
                          if (selected.status !== option) {
                            void handleStatusChange(selected.id, option);
                          }
                        }}
                        aria-pressed={selected.status === option}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>

                <p className="admin-citizen-text">{selected.description}</p>

                <p>
                  <strong>Categoria:</strong> {selected.category}
                </p>
                <p>
                  <strong>Prioridade:</strong> {selected.priority}
                </p>
                <p>
                  <strong>Localização:</strong> {selected.locationText}
                </p>

                <div className="admin-ai-summary">
                  <h3>Resumo Técnico (IA)</h3>
                  <p>{selected.technicalSummary}</p>
                </div>
              </div>

              {env.googleMapsApiKey ? (
                <div className="admin-map-wrapper">
                  <APIProvider apiKey={env.googleMapsApiKey}>
                    <Map
                      defaultCenter={{ lat: selected.latitude, lng: selected.longitude }}
                      defaultZoom={16}
                      mapId={DEFAULT_GOOGLE_MAP_ID}
                      gestureHandling="greedy"
                      style={{ width: "100%", height: "100%" }}
                    >
                      <MapAutoRecenter
                        center={{
                          lat: selected.latitude,
                          lng: selected.longitude,
                        }}
                      />
                      <Marker
                        position={{
                          lat: selected.latitude,
                          lng: selected.longitude,
                        }}
                        icon={buildCategoryPinIcon(selected.category)}
                      />
                    </Map>
                  </APIProvider>
                </div>
              ) : (
                <p className="notice">
                  Configure NEXT_PUBLIC_GOOGLE_MAPS_API_KEY para exibir o mapa.
                </p>
              )}
            </>
          ) : (
            <p className="admin-empty">Selecione um chamado na lista.</p>
          )}
        </section>
      </div>
    </div>
  );
}

