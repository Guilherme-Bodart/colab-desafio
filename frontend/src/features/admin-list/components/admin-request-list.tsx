"use client";

import { APIProvider, Map, Marker, useMap } from "@vis.gl/react-google-maps";
import { useEffect, useMemo, useState } from "react";
import { env } from "@/src/lib/env";
import type { AdminRequest, RequestStatus } from "@/src/types/request";
import { listRequests } from "../services/list-requests";
import { updateRequestStatus } from "../services/update-request-status";

type ToastItem = {
  id: number;
  type: "success" | "error";
  title: string;
  description: string;
};

const categoryOptions = [
  "Limpeza Urbana e Manejo de Resíduos",
  "Manutenção de Áreas Verdes e Paisagismo",
  "Infraestrutura e Conservação do Mobiliário Urbano",
  "Drenagem e Saneamento",
  "Poluição Visual e Ambiental",
  "Controle de Zoonoses e Pragas",
  "Outros",
];

const priorityOptions = ["Alta", "Média", "Baixa"];
const statusOptions: RequestStatus[] = ["Pendente", "Resolvida", "Cancelada"];
const pageSize = 12;

type CategoryPinConfig = {
  color: string;
  symbolSvg: string;
};

const defaultPin: CategoryPinConfig = {
  color: "#6B7280",
  symbolSvg:
    '<circle cx="21" cy="18" r="2.2" fill="#ffffff" /><circle cx="27" cy="18" r="2.2" fill="#ffffff" /><circle cx="33" cy="18" r="2.2" fill="#ffffff" />',
};

const greenLeafPinSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="48" height="48"><ellipse cx="12" cy="22" rx="4" ry="1.5" fill="rgba(0,0,0,0.15)" /><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" fill="#10B981" stroke="#ffffff" stroke-width="1.5" stroke-linejoin="round" /><g transform="translate(0.35 0.15)" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M16 5 C 8 5 7 9 8 14 C 13 14 16 11 16 5 Z" /><path d="M8 13 L 6.5 15.5" /><path d="M8 14 L 16 5" /><path d="M10 9 L 12 11" /></g></svg>`;

function normalizeCategory(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function resolveCategoryPinConfig(category: string): CategoryPinConfig {
  const normalized = normalizeCategory(category);

  if (normalized.includes("residuo") || normalized.includes("limpeza")) {
    return {
      color: "#2563EB",
      symbolSvg:
        '<rect x="20" y="13" width="14" height="14" rx="2" fill="none" stroke="#ffffff" stroke-width="2.6" /><line x1="18" y1="13" x2="36" y2="13" stroke="#ffffff" stroke-width="2.6" /><line x1="24" y1="10" x2="30" y2="10" stroke="#ffffff" stroke-width="2.6" />',
    };
  }

  if (normalized.includes("verde") || normalized.includes("paisagismo")) {
    return {
      color: "#16A34A",
      symbolSvg:
        '<path d="M27 10.8c-6.5 0-10.5 5.1-10.5 11.1 0 4.6 3.2 7.8 7.6 7.8 7.2 0 11.8-6.2 11.8-16.9 0-1-.1-1.5-.1-1.5S32.9 10.8 27 10.8z" fill="none" stroke="#ffffff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" /><path d="M18.1 31.1l3-2.9M21.1 28.2c3.4-3.5 6.9-8 10.7-14M23.6 24.9c2.3-.1 4.7-.7 7-1.6M24.9 21.2c2-.1 4.1-.6 6.1-1.4" fill="none" stroke="#ffffff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" />',
    };
  }

  if (normalized.includes("infraestrutura") || normalized.includes("mobiliario")) {
    return {
      color: "#F59E0B",
      symbolSvg:
        '<path d="M27 11.5l8.5 15.5h-17L27 11.5z" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linejoin="round" /><line x1="21.5" y1="21" x2="32.5" y2="21" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" /><line x1="19.2" y1="27.8" x2="34.8" y2="27.8" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" />',
    };
  }

  if (normalized.includes("drenagem") || normalized.includes("saneamento")) {
    return {
      color: "#06B6D4",
      symbolSvg:
        '<path d="M27 10c0 0-9 9-9 14a9 9 0 0018 0c0-5-9-14-9-14z" fill="none" stroke="#ffffff" stroke-width="2.6" stroke-linejoin="round" />',
    };
  }

  if (normalized.includes("poluicao") || normalized.includes("ambiental")) {
    return {
      color: "#DC2626",
      symbolSvg:
        '<path d="M16 20c2.8-4.5 6.5-6.8 11-6.8S35.2 15.5 38 20c-2.8 4.5-6.5 6.8-11 6.8S18.8 24.5 16 20z" fill="none" stroke="#ffffff" stroke-width="2.6" stroke-linejoin="round" /><circle cx="27" cy="20" r="3.2" fill="none" stroke="#ffffff" stroke-width="2.6" /><line x1="17.5" y1="28.5" x2="36.5" y2="11.5" stroke="#ffffff" stroke-width="2.6" stroke-linecap="round" />',
    };
  }

  if (normalized.includes("zoonose") || normalized.includes("praga")) {
    return {
      color: "#7C3AED",
      symbolSvg:
        '<ellipse cx="27" cy="20" rx="6" ry="8" fill="none" stroke="#ffffff" stroke-width="2.6" /><circle cx="27" cy="12.5" r="2.5" fill="none" stroke="#ffffff" stroke-width="2.6" /><line x1="21" y1="19" x2="16" y2="16" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" /><line x1="21" y1="22" x2="16" y2="25" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" /><line x1="33" y1="19" x2="38" y2="16" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" /><line x1="33" y1="22" x2="38" y2="25" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" />',
    };
  }

  return defaultPin;
}

function buildCategoryPinIcon(category: string): string {
  const normalized = normalizeCategory(category);
  if (normalized.includes("verde") || normalized.includes("paisagismo")) {
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(greenLeafPinSvg)}`;
  }

  const pin = resolveCategoryPinConfig(category);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="54" height="54" viewBox="0 0 54 54" fill="none"><path d="M27 2C17.1 2 9 10.1 9 20c0 12.2 14.7 27.9 17.1 30.4a1.3 1.3 0 0 0 1.9 0C30.3 47.9 45 32.2 45 20 45 10.1 36.9 2 27 2z" fill="${pin.color}" stroke="#0f172a" stroke-opacity="0.15" stroke-width="1.5"/><circle cx="27" cy="20" r="12.5" fill="#ffffff" fill-opacity="0.12"/>${pin.symbolSvg}</svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function RecenterMap({
  latitude,
  longitude,
}: {
  latitude: number;
  longitude: number;
}) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    map.panTo({ lat: latitude, lng: longitude });
  }, [map, latitude, longitude]);

  return null;
}

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
  const [statusFilter, setStatusFilter] = useState("");
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

        if (!response.data.find((item) => item.id === selectedId)) {
          setSelectedId(response.data[0]?.id ?? null);
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Erro ao carregar solicitações.";
        pushToast("error", "Falha ao carregar lista", message);
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [page, search, categoryFilter, priorityFilter, statusFilter, selectedId]);

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

      <section className="admin-toolbar">
        <div>
          <h2>Painel Administrativo</h2>
          <p className="admin-toolbar-sub">
            Mostrando {items.length} de {total} chamados
          </p>
        </div>

        <div className="admin-toolbar-controls">
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Buscar por título ou endereço"
          />

          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
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
            onChange={(e) => {
              setPriorityFilter(e.target.value);
              setPage(1);
            }}
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
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Status: Todos</option>
            {statusOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>

          {hasActiveFilters ? (
            <button type="button" className="admin-clear-btn" onClick={clearFilters}>
              Limpar filtros
            </button>
          ) : null}
        </div>
      </section>

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
                <div>
                  <h1>{selected.title}</h1>
                  <p className="admin-citizen-text">{selected.description}</p>
                </div>

                <div className="admin-status-control">
                  <label htmlFor="status-select">Mudar Status</label>
                  <select
                    id="status-select"
                    value={selected.status}
                    onChange={(e) =>
                      handleStatusChange(selected.id, e.target.value as RequestStatus)
                    }
                  >
                    {statusOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

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
                      gestureHandling="greedy"
                      style={{ width: "100%", height: "100%" }}
                    >
                      <RecenterMap
                        latitude={selected.latitude}
                        longitude={selected.longitude}
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

