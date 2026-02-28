import { describe, expect, it } from "vitest";
import {
  diffVisibleMarkers,
  findVisibleMarkerIds,
} from "./marker-visibility.service";

function buildMarker(position: { lat: number; lng: number } | null) {
  return {
    getPosition: () => position,
  } as unknown as google.maps.Marker;
}

function buildBounds(minLat: number, maxLat: number, minLng: number, maxLng: number) {
  return {
    contains: (position: { lat: number; lng: number }) =>
      position.lat >= minLat &&
      position.lat <= maxLat &&
      position.lng >= minLng &&
      position.lng <= maxLng,
  } as unknown as google.maps.LatLngBounds;
}

describe("marker-visibility.service", () => {
  it("identifica ids de marcadores dentro dos bounds", () => {
    const markers = new Map<string, google.maps.Marker>([
      ["inside", buildMarker({ lat: -20.3, lng: -40.2 })],
      ["outside", buildMarker({ lat: -10, lng: -50 })],
      ["no-position", buildMarker(null)],
    ]);

    const visibleIds = findVisibleMarkerIds(
      markers,
      buildBounds(-21, -20, -41, -39)
    );

    expect(Array.from(visibleIds)).toEqual(["inside"]);
  });

  it("calcula diferenca entre visiveis anteriores e atuais", () => {
    const markerA = buildMarker({ lat: -20.3, lng: -40.2 });
    const markerB = buildMarker({ lat: -20.4, lng: -40.3 });
    const markerC = buildMarker({ lat: -20.5, lng: -40.4 });

    const markers = new Map<string, google.maps.Marker>([
      ["a", markerA],
      ["b", markerB],
      ["c", markerC],
    ]);

    const previous = new Set<string>(["a", "b"]);
    const next = new Set<string>(["b", "c"]);

    const { addedMarkers, removedMarkers } = diffVisibleMarkers(
      markers,
      previous,
      next
    );

    expect(addedMarkers).toEqual([markerC]);
    expect(removedMarkers).toEqual([markerA]);
  });
});
