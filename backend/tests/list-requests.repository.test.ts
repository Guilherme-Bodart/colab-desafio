import { beforeEach, describe, expect, it, vi } from "vitest";
import { listRequests } from "../src/modules/requests/repositories/request.repository";
import { db } from "../src/db/client";

vi.mock("../src/db/client", () => ({
  db: {
    query: vi.fn(),
  },
}));

const mockedDbQuery = vi.mocked(db.query);

describe("request.repository listRequests", () => {
  beforeEach(() => {
    mockedDbQuery.mockReset();
  });

  it("aplica busca somente por location_text", async () => {
    mockedDbQuery
      .mockResolvedValueOnce({ rows: [{ total: 1 }] } as any)
      .mockResolvedValueOnce({ rows: [] } as any);

    await listRequests({
      page: 1,
      limit: 1000,
      search: "Rua A",
      category: undefined,
      priority: undefined,
      status: undefined,
      dateFrom: undefined,
      dateTo: undefined,
    });

    expect(mockedDbQuery).toHaveBeenCalledTimes(2);

    const countSql = mockedDbQuery.mock.calls[0][0] as string;
    const dataSql = mockedDbQuery.mock.calls[1][0] as string;
    const countParams = mockedDbQuery.mock.calls[0][1] as unknown[];

    expect(countSql).toContain("location_text ILIKE");
    expect(dataSql).toContain("location_text ILIKE");
    expect(countSql).not.toContain("title ILIKE");
    expect(countSql).not.toContain("description ILIKE");
    expect(countParams).toContain("%Rua A%");
  });
});
