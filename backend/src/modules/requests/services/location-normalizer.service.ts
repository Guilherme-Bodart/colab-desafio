import { env } from "../../../config/env";

type GeocodeResponse = {
  status: string;
  results?: Array<{
    formatted_address?: string;
  }>;
};

export async function normalizeLocationText(input: {
  locationText: string;
  latitude: number;
  longitude: number;
}): Promise<string> {
  if (!env.googleMapsApiKey) {
    return input.locationText;
  }

  const endpoint = new URL("https://maps.googleapis.com/maps/api/geocode/json");
  endpoint.searchParams.set("latlng", `${input.latitude},${input.longitude}`);
  endpoint.searchParams.set("language", "pt-BR");
  endpoint.searchParams.set("key", env.googleMapsApiKey);

  try {
    const response = await fetch(endpoint.toString());
    if (!response.ok) {
      return input.locationText;
    }

    const payload = (await response.json()) as GeocodeResponse;
    if (payload.status !== "OK") {
      return input.locationText;
    }

    const formatted = payload.results?.[0]?.formatted_address?.trim();
    return formatted || input.locationText;
  } catch {
    return input.locationText;
  }
}
