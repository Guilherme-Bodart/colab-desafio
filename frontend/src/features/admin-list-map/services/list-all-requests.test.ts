import { beforeEach, describe, expect, it, vi } from "vitest";
import { listRequests } from "@/src/features/admin-list/services/list-requests";
import { listAllRequests } from "./list-all-requests";

vi.mock("@/src/features/admin-list/services/list-requests", () => ({
  listRequests: vi.fn(),
}));

const mockedListRequests = vi.mocked(listRequests);

describe("listAllRequests", () => {
  beforeEach(() => {
    mockedListRequests.mockReset();
  });

  it("busca todas as paginas em lotes de 1000 e agrega os resultados", async () => {
    mockedListRequests
      .mockResolvedValueOnce({
        data: [{ id: "1" }] as any,
        pagination: { page: 1, limit: 1000, total: 2001, totalPages: 3 },
      })
      .mockResolvedValueOnce({
        data: [{ id: "2" }] as any,
        pagination: { page: 2, limit: 1000, total: 2001, totalPages: 3 },
      })
      .mockResolvedValueOnce({
        data: [{ id: "3" }] as any,
        pagination: { page: 3, limit: 1000, total: 2001, totalPages: 3 },
      });

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
    mockedListRequests.mockResolvedValueOnce({
      data: [] as any,
      pagination: { page: 1, limit: 1000, total: 0, totalPages: 1 },
    });

    const result = await listAllRequests({});

    expect(mockedListRequests).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ data: [], total: 0 });
  });
});
