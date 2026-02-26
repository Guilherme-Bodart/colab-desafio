import type { Request, Response } from "express";
import { findRequestById } from "../repositories/request.repository";
import { requestIdSchema } from "../schemas/request-id.schema";

export async function getRequestByIdController(req: Request, res: Response) {
  const parsed = requestIdSchema.safeParse(req.params);

  if (!parsed.success) {
    return res.status(400).json({
      message: "ID inválido",
      errors: parsed.error.flatten(),
    });
  }

  try {
    const requestItem = await findRequestById(parsed.data.id);

    if (!requestItem) {
      return res.status(404).json({
        message: "Solicitação não encontrada",
      });
    }

    return res.status(200).json(requestItem);
  } catch (error) {
    console.error("Erro ao buscar solicitação:", error);
    return res.status(500).json({
      message: "Erro interno ao buscar solicitação",
    });
  }
}
