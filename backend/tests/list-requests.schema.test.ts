import { describe, expect, it } from "vitest";
import { listRequestsSchema } from "../src/modules/requests/schemas/list-requests.schema";

describe("listRequestsSchema", () => {
  it("aceita limit ate 1000", () => {
    const parsed = listRequestsSchema.safeParse({
      page: 1,
      limit: 1000,
    });

    expect(parsed.success).toBe(true);
  });

  it("rejeita limit acima de 1000", () => {
    const parsed = listRequestsSchema.safeParse({
      page: 1,
      limit: 1001,
    });

    expect(parsed.success).toBe(false);
  });
});
