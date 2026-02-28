import { beforeEach, describe, expect, it, vi } from "vitest";
import { listRequests } from "@/src/features/admin-list/services/list-requests";
import type { AdminRequest, ListRequestsResponse } from "@/src/types/request";
import { listAllRequests } from "./list-all-requests";

vi.mock("@/src/features/admin-list/services/list-requests", () => ({
  listRequests: vi.fn(),
}));

const mockedListRequests = vi.mocked(listRequests);

function buildRequest(id: string): AdminRequest {
  return {
    id,
    provider: "gemini",
    status: "Pendente",
    title: `Titulo ${id}`,
    description: `Descricao ${id}`,
    locationText: `Rua ${id}`,
    latitude: -20.3,
    longitude: -40.2,
    category: "Outros",
    priority: "Baixa",
    technicalSummary: "Resumo tecnico",
    createdAt: new Date().toISOString(),
  };
}

function buildPageResponse(params: {
  page: number;
  total: number;
  totalPages: number;
  ids: string[];
}): ListRequestsResponse {
  return {
    data: params.ids.map(buildRequest),
    pagination: {
      page: params.page,
      limit: 1000,
      total: params.total,
      totalPages: params.totalPages,
    },
  };
}

describe("listAllRequests", () => {
  beforeEach(() => {
    mockedListRequests.mockReset();
  });

  it("busca todas as paginas em lotes de 1000 e agrega os resultados", async () => {
    mockedListRequests
      .mockResolvedValueOnce(
        buildPageResponse({ page: 1, total: 2001, totalPages: 3, ids: ["1"] })
      )
      .mockResolvedValueOnce(
        buildPageResponse({ page: 2, total: 2001, totalPages: 3, ids: ["2"] })
      )
      .mockResolvedValueOnce(
        buildPageResponse({ page: 3, total: 2001, totalPages: 3, ids: ["3"] })
      );

    const result = await listAllRequests({
      search: "praia",
      status: "Pendente",
    });

    expect(mockedListRequests).toHaveBeenCalledTimes(3);
    expect(mockedListRequests).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ page: 1, limit: 1000, search: "praia" })
    );
    expect(mockedListRequests).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({ page: 3, limit: 1000, status: "Pendente" })
    );
    expect(result.total).toBe(2001);
    expect(result.data.map((item) => item.id)).toEqual(["1", "2", "3"]);
  });

  it("faz apenas uma chamada quando ha uma pagina", async () => {
    mockedListRequests.mockResolvedValueOnce(
      buildPageResponse({ page: 1, total: 0, totalPages: 1, ids: [] })
    );

    const result = await listAllRequests({});

    expect(mockedListRequests).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ data: [], total: 0 });
  });
});
