"use client";

import { APIProvider, Map, Marker } from "@vis.gl/react-google-maps";
import { useEffect, useMemo, useState } from "react";
import { env } from "@/src/lib/env";
import type { AdminRequest, RequestStatus } from "@/src/types/request";
import { listRequests } from "../services/list-requests";
import { updateRequestStatus } from "../services/update-request-status";

const statusOptions: RequestStatus[] = ["Pendente", "Resolvida", "Cancelada"];

type ToastItem = {
  id: number;
  type: "success" | "error";
  title: string;
  description: string;
};

export function AdminRequestList() {
  const [items, setItems] = useState<AdminRequest[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const response = await listRequests();
        setItems(response.data);
        if (response.data[0]) {
          setSelectedId(response.data[0].id);
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
  }, []);

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

  const selected = useMemo(
    () => items.find((item) => item.id === selectedId) ?? null,
    [items, selectedId]
  );

  async function handleStatusChange(id: string, status: RequestStatus) {
    try {
      const updated = await updateRequestStatus(id, status);
      setItems((prev) => prev.map((item) => (item.id === id ? updated : item)));
      pushToast(
        "success",
        "Status atualizado",
        `A solicitação foi atualizada para "${status}".`
      );
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Erro ao atualizar status da solicitação.";
      pushToast("error", "Falha ao atualizar status", message);
    }
  }

  if (loading) return <p>Carregando solicitações...</p>;

  return (
    <div className="admin-root">
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

      <div className="admin-layout">
        <section className="admin-list">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`admin-item ${
                item.id === selectedId ? "is-selected" : ""
              }`}
              onClick={() => setSelectedId(item.id)}
            >
              <strong>{item.title}</strong>
              <span>{item.category}</span>
              <span className="admin-meta">
                {item.priority} | {item.status}
              </span>
            </button>
          ))}
        </section>

        <section className="admin-detail">
          {selected ? (
            <>
              <div className="admin-detail-text">
                <h2>{selected.title}</h2>
                <p>{selected.description}</p>
                <p>
                  <strong>Categoria:</strong> {selected.category}
                </p>
                <p>
                  <strong>Prioridade:</strong> {selected.priority}
                </p>
                <p>
                  <strong>Resumo técnico:</strong> {selected.technicalSummary}
                </p>
                <p>
                  <strong>Localização:</strong> {selected.locationText}
                </p>
              </div>

              <div className="status-actions">
                {statusOptions.map((status) => (
                  <button
                    key={status}
                    type="button"
                    className={`status-btn ${
                      selected.status === status ? "status-active" : ""
                    }`}
                    onClick={() => handleStatusChange(selected.id, status)}
                  >
                    {status}
                  </button>
                ))}
              </div>

              {env.googleMapsApiKey ? (
                <div className="admin-map-wrapper">
                  <APIProvider apiKey={env.googleMapsApiKey}>
                    <Map
                      center={{ lat: selected.latitude, lng: selected.longitude }}
                      defaultZoom={16}
                      gestureHandling="none"
                      disableDefaultUI
                      style={{ width: "100%", height: "100%" }}
                    >
                      <Marker
                        position={{
                          lat: selected.latitude,
                          lng: selected.longitude,
                        }}
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
            <p>Selecione uma solicitação na lista.</p>
          )}
        </section>
      </div>
    </div>
  );
}
