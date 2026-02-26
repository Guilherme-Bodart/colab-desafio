import { env } from "@/src/lib/env";
import type {
  ApiResponse,
  RejectedRequestResponse,
  RequestPayload,
} from "@/src/types/request";

export async function createRequest(
  payload: RequestPayload
): Promise<ApiResponse | RejectedRequestResponse> {
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

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message ?? "Não foi possível enviar a solicitação.");
  }

  return data as ApiResponse | RejectedRequestResponse;
}
