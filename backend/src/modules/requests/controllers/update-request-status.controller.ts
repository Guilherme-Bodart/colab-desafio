import type { Request, Response } from "express";
import { findRequestById, updateRequestStatus } from "../repositories/request.repository";
import { requestIdSchema } from "../schemas/request-id.schema";
import { updateRequestStatusSchema } from "../schemas/update-request-status.schema";

export async function updateRequestStatusController(req: Request, res: Response) {
  const idParsed = requestIdSchema.safeParse(req.params);
  if (!idParsed.success) {
    return res.status(400).json({
      message: "ID inválido",
      errors: idParsed.error.flatten(),
    });
  }

  const bodyParsed = updateRequestStatusSchema.safeParse(req.body);
  if (!bodyParsed.success) {
    return res.status(400).json({
      message: "Status inválido",
      errors: bodyParsed.error.flatten(),
    });
  }

  try {
    const existing = await findRequestById(idParsed.data.id);
    if (!existing) {
      return res.status(404).json({ message: "Solicitação não encontrada" });
    }

    const updated = await updateRequestStatus(idParsed.data.id, bodyParsed.data.status);
    return res.status(200).json(updated);
  } catch (error) {
    console.error("Erro ao atualizar status:", error);
    return res.status(500).json({ message: "Erro interno ao atualizar status" });
  }
}
