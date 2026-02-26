import { env } from "@/src/lib/env";
import type { ListRequestsResponse } from "@/src/types/request";

export async function listRequests(): Promise<ListRequestsResponse> {
  const response = await fetch(`${env.apiBaseUrl}/requests?page=1&limit=100`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Não foi possível carregar a lista de solicitações.");
  }

  return (await response.json()) as ListRequestsResponse;
}
