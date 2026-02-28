export function findVisibleMarkerIds(
  markers: globalThis.Map<string, google.maps.Marker>,
  bounds: google.maps.LatLngBounds
): Set<string> {
  const visibleIds = new Set<string>();

  markers.forEach((marker, id) => {
    const position = marker.getPosition();
    if (!position) return;
    if (bounds.contains(position)) {
      visibleIds.add(id);
    }
  });

  return visibleIds;
}

export function diffVisibleMarkers(
  markers: globalThis.Map<string, google.maps.Marker>,
  previousVisibleIds: Set<string>,
  nextVisibleIds: Set<string>
): {
  addedMarkers: google.maps.Marker[];
  removedMarkers: google.maps.Marker[];
} {
  const addedMarkers: google.maps.Marker[] = [];
  const removedMarkers: google.maps.Marker[] = [];

  previousVisibleIds.forEach((id) => {
    if (!nextVisibleIds.has(id)) {
      const marker = markers.get(id);
      if (marker) removedMarkers.push(marker);
    }
  });

  nextVisibleIds.forEach((id) => {
    if (!previousVisibleIds.has(id)) {
      const marker = markers.get(id);
      if (marker) addedMarkers.push(marker);
    }
  });

  return {
    addedMarkers,
    removedMarkers,
  };
}
