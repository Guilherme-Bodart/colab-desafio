import type { Request, Response } from "express";
import { createRequestRecord } from "../repositories/request.repository";
import { AIProviderError } from "../errors/ai-provider.error";
import { createRequestSchema } from "../schemas/create-request.schema";
import { normalizeLocationText } from "../services/location-normalizer.service";
import { processCitizenRequest } from "../services/triage.service";

export async function createRequestController(req: Request, res: Response) {
  const parsed = createRequestSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      message: "Dados inválidos",
      errors: parsed.error.flatten(),
    });
  }

  try {
    const normalizedLocationText = await normalizeLocationText({
      locationText: parsed.data.locationText,
      latitude: parsed.data.latitude,
      longitude: parsed.data.longitude,
    });

    const normalizedInput = {
      ...parsed.data,
      locationText: normalizedLocationText,
    };

    const triage = await processCitizenRequest(normalizedInput);

    const saved = await createRequestRecord({
      ...normalizedInput,
      ...triage,
    });

    return res.status(201).json(saved);
  } catch (error) {
    console.error("Erro ao salvar solicitação:", error);

    if (error instanceof AIProviderError) {
      return res.status(error.statusCode).json({
        message: error.message,
        provider: error.provider,
        detail: error.detail,
      });
    }

    return res.status(500).json({
      message: "Erro interno ao salvar solicitação",
    });
  }
}
