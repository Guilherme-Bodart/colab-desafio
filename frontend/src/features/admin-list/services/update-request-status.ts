import { env } from "@/src/lib/env";
import type { AdminRequest, RequestStatus } from "@/src/types/request";

export async function updateRequestStatus(
  id: string,
  status: RequestStatus
): Promise<AdminRequest> {
  const response = await fetch(`${env.apiBaseUrl}/requests/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    throw new Error("Não foi possível atualizar o status.");
  }

  return (await response.json()) as AdminRequest;
}
