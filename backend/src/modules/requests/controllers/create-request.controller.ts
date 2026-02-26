import type { Request, Response } from "express";
import { createRequestSchema } from "../schemas/create-request.schema";
import { processCitizenRequest } from "../services/triage.service";

export function createRequestController(req: Request, res: Response) {
  const parsed = createRequestSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      message: "Dados invalidos",
      errors: parsed.error.flatten(),
    });
  }

  const processed = processCitizenRequest(parsed.data);
  return res.status(201).json(processed);
}
