import { env } from "@/src/lib/env";
import type { ApiResponse, RequestPayload } from "@/src/types/request";

export async function createRequest(
  payload: RequestPayload
): Promise<ApiResponse> {
  const response = await fetch(`${env.apiBaseUrl}/requests`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: payload.title,
      description: payload.description,
      locationText: payload.locationText,
      latitude: payload.latitude,
      longitude: payload.longitude,
    }),
  });

  if (!response.ok) {
    throw new Error("Nao foi possivel enviar a solicitacao.");
  }

  return (await response.json()) as ApiResponse;
}
