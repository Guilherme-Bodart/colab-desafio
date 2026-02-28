import type { Renderer } from "@googlemaps/markerclusterer";

type ClusterStyle = {
  size: number;
  bgColor: string;
  borderColor: string;
  textColor: string;
};

const iconCache = new globalThis.Map<string, string>();

function resolveClusterStyle(count: number): ClusterStyle {
  if (count >= 50) {
    return {
      size: 54,
      bgColor: "#0c6fdb",
      borderColor: "#095db9",
      textColor: "#ffffff",
    };
  }

  if (count >= 10) {
    return {
      size: 48,
      bgColor: "#93c5fd",
      borderColor: "#0c6fdb",
      textColor: "#123f84",
    };
  }

  return {
    size: 42,
    bgColor: "#dbeafe",
    borderColor: "#60a5fa",
    textColor: "#1e3a8a",
  };
}

function getClusterIconUrl(count: number, style: ClusterStyle): string {
  const fontSize = count >= 100 ? 13 : 14;
  const cacheKey = `${count}-${style.size}-${style.bgColor}-${style.borderColor}-${style.textColor}`;
  const cachedIcon = iconCache.get(cacheKey);
  if (cachedIcon) return cachedIcon;

  const center = style.size / 2;
  const radius = center - 2;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${style.size}" height="${style.size}" viewBox="0 0 ${style.size} ${style.size}">
      <circle cx="${center}" cy="${center}" r="${radius}" fill="${style.bgColor}" stroke="${style.borderColor}" stroke-width="3" />
      <text x="50%" y="50%" text-anchor="middle" dominant-baseline="central" fill="${style.textColor}" font-family="Roboto, Arial, sans-serif" font-size="${fontSize}" font-weight="700">${count}</text>
    </svg>
  `;
  const iconUrl = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  iconCache.set(cacheKey, iconUrl);
  return iconUrl;
}

export const adminClusterRenderer: Renderer = {
  render: ({ count, position }) => {
    const style = resolveClusterStyle(count);
    const maxZIndex = (google.maps.Marker.MAX_ZINDEX ?? 100000) as number;

    return new google.maps.Marker({
      position,
      icon: {
        url: getClusterIconUrl(count, style),
        scaledSize: new google.maps.Size(style.size, style.size),
      },
      zIndex: maxZIndex + count,
    });
  },
};
