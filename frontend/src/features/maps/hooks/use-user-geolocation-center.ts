"use client";

import { useEffect, useState } from "react";

export function useUserGeolocationCenter(): google.maps.LatLngLiteral | null {
  const [userCenter, setUserCenter] = useState<google.maps.LatLngLiteral | null>(
    null
  );

  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (coords) => {
        setUserCenter({
          lat: coords.coords.latitude,
          lng: coords.coords.longitude,
        });
      },
      () => {
        // Se a permissao for negada, mantemos o centro padrao.
      }
    );
  }, []);

  return userCenter;
}
