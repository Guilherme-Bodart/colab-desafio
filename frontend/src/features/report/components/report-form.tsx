"use client";

import { FormEvent, useState } from "react";
import { createRequest } from "@/src/features/report/services/create-request";
import type { ApiResponse, RequestPayload } from "@/src/types/request";
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
  const [error, setError] = useState("");
  const [result, setResult] = useState<ApiResponse | null>(null);

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
    setError("");
    setResult(null);

    if (form.latitude === null || form.longitude === null) {
      setLoading(false);
      setError("Selecione um ponto no mapa para enviar a solicitacao.");
      return;
    }

    try {
      const data = await createRequest(form);
      setResult(data);
      setForm(initialForm);
    } catch {
      setError("Erro ao processar solicitacao. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="form">
      <label>
        Titulo
        <input
          required
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="Ex: Buraco na rua"
        />
      </label>

      <label>
        Descricao
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
        {loading ? "Processando..." : "Enviar solicitacao"}
      </button>

      {error ? <p className="error">{error}</p> : null}

      {result ? (
        <div className="success">
          <h2>Solicitacao registrada</h2>
          <p>
            <strong>Categoria:</strong> {result.category}
          </p>
          <p>
            <strong>Prioridade:</strong> {result.priority}
          </p>
          <p>
            <strong>Resumo tecnico:</strong> {result.technicalSummary}
          </p>
        </div>
      ) : null}
    </form>
  );
}
