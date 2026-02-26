"use client";

import { FormEvent, useState } from "react";
import { createRequest } from "@/src/features/report/services/create-request";
import type {
  ApiResponse,
  RejectedRequestResponse,
  RequestPayload,
} from "@/src/types/request";
import { LocationField } from "./location-field";

const initialForm: RequestPayload = {
  title: "",
  description: "",
  locationText: "",
  latitude: null,
  longitude: null,
};

export function ReportForm() {
  const [form, setForm] = useState<RequestPayload>(initialForm);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ApiResponse | null>(null);
  const [toasts, setToasts] = useState<
    Array<{
      id: number;
      type: "success" | "error" | "warning";
      title: string;
      description: string;
    }>
  >([]);

  function pushToast(
    type: "success" | "error" | "warning",
    title: string,
    description: string
  ) {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((prev) => [...prev, { id, type, title, description }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 3200);
  }

  function updateLocationText(address: string) {
    setForm((prev) => ({ ...prev, locationText: address }));
  }

  function updateLocationPoint(point: google.maps.LatLngLiteral) {
    setForm((prev) => ({
      ...prev,
      latitude: point.lat,
      longitude: point.lng,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setResult(null);

    if (form.latitude === null || form.longitude === null) {
      setLoading(false);
      pushToast(
        "error",
        "Localização incompleta",
        "Selecione um ponto no mapa antes de enviar a solicitação."
      );
      return;
    }

    try {
      const data = await createRequest(form);

      if ("accepted" in data && data.accepted === false) {
        const rejected = data as RejectedRequestResponse;
        pushToast("warning", "Solicitação fora do escopo", rejected.message);
        return;
      }

      setResult(data as ApiResponse);
      setForm(initialForm);
      pushToast(
        "success",
        "Solicitação enviada",
        "Triagem concluída e solicitação registrada com sucesso."
      );
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Erro ao processar solicitação. Tente novamente.";
      pushToast("error", "Falha no envio", message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="toast-stack">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`toast-item ${
              toast.type === "success"
                ? "toast-success"
                : toast.type === "warning"
                  ? "toast-warning"
                  : "toast-error"
            }`}
          >
            <strong>{toast.title}</strong>
            <p>{toast.description}</p>
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="form">
        <label>
          Título
          <input
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Ex: Buraco na rua"
          />
        </label>

        <label>
          Descrição
          <textarea
            required
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Descreva o problema"
            rows={5}
          />
        </label>

        <LocationField
          value={form.locationText}
          onAddressChange={updateLocationText}
          onPointChange={updateLocationPoint}
        />

        {form.latitude !== null && form.longitude !== null ? (
          <p className="coords">
            Lat: {form.latitude.toFixed(6)} | Lng: {form.longitude.toFixed(6)}
          </p>
        ) : null}

        <button type="submit" disabled={loading}>
          {loading ? "Processando..." : "Enviar solicitação"}
        </button>

        {result ? (
          <div className="success">
            <h2>Solicitação registrada</h2>
            <p>
              <strong>Categoria:</strong> {result.category}
            </p>
            <p>
              <strong>Prioridade:</strong> {result.priority}
            </p>
            <p>
              <strong>Resumo técnico:</strong> {result.technicalSummary}
            </p>
          </div>
        ) : null}
      </form>
    </div>
  );
}
