"use client";

import { useEffect } from "react";
import { useMap } from "@vis.gl/react-google-maps";

type MapZoomModeSyncProps = {
  onModeChange: (enabled: boolean) => void;
  resolveModeForZoom: (zoom: number) => boolean;
};

export function MapZoomModeSync({
  onModeChange,
  resolveModeForZoom,
}: MapZoomModeSyncProps) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    const syncMode = () => {
      const zoom = map.getZoom() ?? 0;
      onModeChange(resolveModeForZoom(zoom));
    };

    syncMode();
    const listener = map.addListener("zoom_changed", syncMode);

    return () => {
      listener.remove();
    };
  }, [map, onModeChange, resolveModeForZoom]);

  return null;
}
