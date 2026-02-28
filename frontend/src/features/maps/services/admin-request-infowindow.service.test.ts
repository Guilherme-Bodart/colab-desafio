import { describe, expect, it, vi } from "vitest";
import type { AdminRequest } from "@/src/types/request";
import {
  buildAdminRequestInfoWindowContent,
  openAdminRequestInfoWindow,
} from "./admin-request-infowindow.service";

function buildRequest(overrides?: Partial<AdminRequest>): AdminRequest {
  return {
    id: "1",
    provider: "gemini",
    status: "Pendente",
    title: "Chamado teste",
    description: "Descricao",
    locationText: "Rua A",
    latitude: -20.3,
    longitude: -40.2,
    category: "Outros",
    priority: "Baixa",
    technicalSummary:
      "Resumo tecnico curto para validar montagem do conteudo do popup.",
    createdAt: "2026-02-28T10:20:00.000Z",
    ...overrides,
  };
}

describe("admin-request-infowindow.service", () => {
  it("monta html do popup com campos principais e escape de texto", () => {
    const content = buildAdminRequestInfoWindowContent(
      buildRequest({
        title: "<script>alert(1)</script>",
        category: "Infra & Obras",
      })
    );

    expect(content).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(content).toContain("Categoria:");
    expect(content).toContain("Prioridade:");
    expect(content).toContain("Criado em:");
    expect(content).toMatch(/\d{2}\/\d{2}\/\d{4}/);
  });

  it("trunca resumo tecnico muito longo", () => {
    const longSummary = "a".repeat(260);
    const content = buildAdminRequestInfoWindowContent(
      buildRequest({ technicalSummary: longSummary })
    );

    expect(content).toContain("...");
    expect(content).not.toContain(longSummary);
  });

  it("abre infowindow reutilizado aplicando headerDisabled", () => {
    const infoWindow = {
      setOptions: vi.fn(),
      setContent: vi.fn(),
      open: vi.fn(),
    } as unknown as google.maps.InfoWindow;
    const marker = {} as google.maps.Marker;
    const map = {} as google.maps.Map;
    const request = buildRequest();

    openAdminRequestInfoWindow({ infoWindow, marker, map, request });

    expect(infoWindow.setOptions).toHaveBeenCalledWith({ headerDisabled: true });
    expect(infoWindow.setContent).toHaveBeenCalledTimes(1);
    expect(infoWindow.open).toHaveBeenCalledWith({ map, anchor: marker });
  });
});
