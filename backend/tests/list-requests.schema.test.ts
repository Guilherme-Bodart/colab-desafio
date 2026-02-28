import { describe, expect, it } from "vitest";
import { ALLOWED_CATEGORY_NAMES } from "../src/modules/categories/category.constants";
import { listRequestsSchema } from "../src/modules/requests/schemas/list-requests.schema";
import { REQUEST_PRIORITIES } from "../src/modules/requests/requests.types";

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

  it("aceita category dentro da lista permitida", () => {
    const parsed = listRequestsSchema.safeParse({
      page: 1,
      limit: 10,
      category: ALLOWED_CATEGORY_NAMES[0],
    });

    expect(parsed.success).toBe(true);
  });

  it("rejeita category fora da lista permitida", () => {
    const parsed = listRequestsSchema.safeParse({
      page: 1,
      limit: 10,
      category: "Categoria Inexistente",
    });

    expect(parsed.success).toBe(false);
  });

  it("aceita priority dentro da lista permitida", () => {
    const parsed = listRequestsSchema.safeParse({
      page: 1,
      limit: 10,
      priority: REQUEST_PRIORITIES[0],
    });

    expect(parsed.success).toBe(true);
  });

  it("rejeita priority fora da lista permitida", () => {
    const parsed = listRequestsSchema.safeParse({
      page: 1,
      limit: 10,
      priority: "Urgente",
    });

    expect(parsed.success).toBe(false);
  });
});
