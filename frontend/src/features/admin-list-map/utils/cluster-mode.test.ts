import { describe, expect, it } from "vitest";
import { isClusterModeEnabledForZoom } from "./cluster-mode";

describe("isClusterModeEnabledForZoom", () => {
  it("mantem cluster ativo ate o zoom 15", () => {
    expect(isClusterModeEnabledForZoom(10, 15)).toBe(true);
    expect(isClusterModeEnabledForZoom(15, 15)).toBe(true);
  });

  it("desativa cluster acima do limite", () => {
    expect(isClusterModeEnabledForZoom(16, 15)).toBe(false);
  });
});
