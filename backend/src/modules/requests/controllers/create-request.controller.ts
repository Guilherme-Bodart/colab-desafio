import type { Request, Response } from "express";
import { createRequestRecord } from "../repositories/request.repository";
import { createRequestSchema } from "../schemas/create-request.schema";
import { processCitizenRequest } from "../services/triage.service";

export async function createRequestController(req: Request, res: Response) {
  const parsed = createRequestSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      message: "Dados invalidos",
      errors: parsed.error.flatten(),
    });
  }

  try {
    const triage = await processCitizenRequest(parsed.data);

    const saved = await createRequestRecord({
      ...parsed.data,
      ...triage,
    });

    return res.status(201).json(saved);
  } catch (error) {
    console.error("Erro ao salvar solicitacao:", error);
    if (error instanceof Error && error.message.toLowerCase().includes("gemini")) {
      const statusCode = error.message.includes("429") ? 503 : 502;
      return res.status(statusCode).json({
        message: "Falha ao processar classificacao com Gemini",
        provider: "gemini",
        detail: error.message,
      });
    }

    return res.status(500).json({
      message: "Erro interno ao salvar solicitacao",
    });
  }
}
