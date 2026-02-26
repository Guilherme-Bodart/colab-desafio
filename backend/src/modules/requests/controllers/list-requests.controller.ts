import type { Request, Response } from "express";
import { listRequests } from "../repositories/request.repository";
import { listRequestsSchema } from "../schemas/list-requests.schema";

export async function listRequestsController(req: Request, res: Response) {
  const parsed = listRequestsSchema.safeParse(req.query);

  if (!parsed.success) {
    return res.status(400).json({
      message: "Filtros invalidos",
      errors: parsed.error.flatten(),
    });
  }

  try {
    const data = await listRequests(parsed.data);
    return res.status(200).json(data);
  } catch (error) {
    console.error("Erro ao listar solicitacoes:", error);
    return res.status(500).json({
      message: "Erro interno ao listar solicitacoes",
    });
  }
}
