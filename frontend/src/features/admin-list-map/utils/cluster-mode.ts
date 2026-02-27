export function isClusterModeEnabledForZoom(
  zoom: number,
  threshold = 15
): boolean {
  return zoom <= threshold;
}
