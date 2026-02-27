import { env } from "@/src/lib/env";
import type { ListRequestsResponse, RequestStatus } from "@/src/types/request";

type ListRequestsParams = {
  page: number;
  limit: number;
  search?: string;
  category?: string;
  priority?: string;
  status?: RequestStatus;
};

export async function listRequests(
  params: ListRequestsParams
): Promise<ListRequestsResponse> {
  const query = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
  });

  if (params.search) query.set("search", params.search);
  if (params.category) query.set("category", params.category);
  if (params.priority) query.set("priority", params.priority);
  if (params.status) query.set("status", params.status);

  const response = await fetch(`${env.apiBaseUrl}/requests?${query.toString()}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Não foi possível carregar a lista de solicitações.");
  }

  return (await response.json()) as ListRequestsResponse;
}
