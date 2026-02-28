import { beforeEach, describe, expect, it } from "vitest";
import { adminClusterRenderer } from "./cluster-renderer.service";

class MockSize {
  constructor(
    public width: number,
    public height: number
  ) {}
}

class MockMarker {
  static MAX_ZINDEX = 100000;
  constructor(public options: google.maps.MarkerOptions) {}
}

describe("cluster-renderer.service", () => {
  beforeEach(() => {
    Reflect.set(globalThis, "google", {
      maps: {
        Marker: MockMarker,
        Size: MockSize,
      },
    });
  });

  it("renderiza cluster medio com tamanho 48 e zIndex correto", () => {
    const cluster = {
      count: 12,
      position: { lat: -20.3, lng: -40.2 } as unknown as google.maps.LatLng,
    } as unknown as Parameters<typeof adminClusterRenderer.render>[0];

    const rendered = adminClusterRenderer.render(cluster) as unknown as MockMarker;
    const icon = rendered.options.icon as google.maps.Icon;
    const size = icon.scaledSize as unknown as MockSize;

    expect(size.width).toBe(48);
    expect(size.height).toBe(48);
    expect(rendered.options.zIndex).toBe(100012);
  });

  it("renderiza tamanhos diferentes para faixas de contagem", () => {
    const lowCluster = {
      count: 3,
      position: { lat: -20.3, lng: -40.2 } as unknown as google.maps.LatLng,
    } as unknown as Parameters<typeof adminClusterRenderer.render>[0];

    const highCluster = {
      count: 70,
      position: { lat: -20.3, lng: -40.2 } as unknown as google.maps.LatLng,
    } as unknown as Parameters<typeof adminClusterRenderer.render>[0];

    const lowRendered = adminClusterRenderer.render(lowCluster) as unknown as MockMarker;
    const highRendered = adminClusterRenderer.render(
      highCluster
    ) as unknown as MockMarker;

    const lowIcon = lowRendered.options.icon as google.maps.Icon;
    const highIcon = highRendered.options.icon as google.maps.Icon;
    const lowSize = lowIcon.scaledSize as unknown as MockSize;
    const highSize = highIcon.scaledSize as unknown as MockSize;

    expect(lowSize.width).toBe(42);
    expect(highSize.width).toBe(54);
  });
});
