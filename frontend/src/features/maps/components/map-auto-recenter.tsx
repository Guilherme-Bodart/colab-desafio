"use client";

import { useEffect } from "react";
import { useMap } from "@vis.gl/react-google-maps";

type MapAutoRecenterProps = {
  center: google.maps.LatLngLiteral | null;
};

export function MapAutoRecenter({ center }: MapAutoRecenterProps) {
  const map = useMap();
  const lat = center?.lat;
  const lng = center?.lng;

  useEffect(() => {
    if (!map || lat === undefined || lng === undefined) return;
    map.panTo({ lat, lng });
  }, [map, lat, lng]);

  return null;
}
