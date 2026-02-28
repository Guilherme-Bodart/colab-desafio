import { describe, expect, it } from "vitest";
import {
  DEFAULT_CATEGORY_NAME,
  normalizeCategoryName,
  resolveAllowedCategoryName,
} from "../src/modules/categories/category.constants";

describe("category constants", () => {
  it("normaliza nome para comparacao em banco", () => {
    expect(normalizeCategoryName("  Drenagem e Saneamento  ")).toBe(
      "drenagem e saneamento"
    );
  });

  it("faz fallback para Outros quando categoria nao e permitida", () => {
    expect(resolveAllowedCategoryName("Categoria Nova")).toBe(
      DEFAULT_CATEGORY_NAME
    );
  });

  it("aceita variacoes com e sem acento para categoria permitida", () => {
    expect(
      resolveAllowedCategoryName("Infraestrutura e Conservacao do Mobiliario Urbano")
    ).toBe("Infraestrutura e Conservação do Mobiliário Urbano");
  });
});
