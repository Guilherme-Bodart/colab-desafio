import { randomUUID } from "node:crypto";
import type { CreateRequestInput, ProcessedRequest } from "../requests.types";

export function processCitizenRequest(
  input: CreateRequestInput
): ProcessedRequest {
  return {
    id: randomUUID(),
    title: input.title,
    description: input.description,
    locationText: input.locationText,
    latitude: input.latitude,
    longitude: input.longitude,
    category: "Via Publica",
    priority: "Media",
    technicalSummary:
      "Relato recebido com indicio de problema em via publica. Requer vistoria tecnica para confirmar extensao e definir acao corretiva.",
    createdAt: new Date().toISOString(),
  };
}
