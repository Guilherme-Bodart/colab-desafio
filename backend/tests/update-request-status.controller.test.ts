import type { Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { updateRequestStatusController } from "../src/modules/requests/controllers/update-request-status.controller";
import {
  findRequestById,
  updateRequestStatus,
} from "../src/modules/requests/repositories/request.repository";

vi.mock("../src/modules/requests/repositories/request.repository", () => ({
  findRequestById: vi.fn(),
  updateRequestStatus: vi.fn(),
}));

const mockedFindRequestById = vi.mocked(findRequestById);
const mockedUpdateRequestStatus = vi.mocked(updateRequestStatus);

function buildResponse() {
  const json = vi.fn();
  const status = vi.fn().mockReturnValue({ json });
  return { res: { status } as unknown as Response, status, json };
}

describe("updateRequestStatusController", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retorna 400 para id invalido", async () => {
    const req = {
      params: { id: "123" },
      body: { status: "Resolvida" },
    } as unknown as Request;
    const { res, status, json } = buildResponse();

    await updateRequestStatusController(req, res);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalled();
  });

  it("retorna 400 para status invalido", async () => {
    const req = {
      params: { id: "79ca4c39-eb70-44b5-97b8-89ff205e1af0" },
      body: { status: "Finalizada" },
    } as unknown as Request;
    const { res, status, json } = buildResponse();

    await updateRequestStatusController(req, res);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalled();
  });

  it("retorna 404 quando solicitacao nao existe", async () => {
    mockedFindRequestById.mockResolvedValue(null);

    const req = {
      params: { id: "79ca4c39-eb70-44b5-97b8-89ff205e1af0" },
      body: { status: "Resolvida" },
    } as unknown as Request;
    const { res, status, json } = buildResponse();

    await updateRequestStatusController(req, res);

    expect(mockedFindRequestById).toHaveBeenCalledWith(
      "79ca4c39-eb70-44b5-97b8-89ff205e1af0"
    );
    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.any(String) })
    );
  });

  it("retorna 200 quando atualiza status com sucesso", async () => {
    mockedFindRequestById.mockResolvedValue({
      id: "79ca4c39-eb70-44b5-97b8-89ff205e1af0",
      provider: "gemini",
      status: "Pendente",
      title: "Teste",
      description: "Teste",
      locationText: "Rua A",
      latitude: -20,
      longitude: -40,
      category: "Outros",
      priority: "Baixa",
      technicalSummary: "Resumo técnico válido para testes.",
      createdAt: new Date().toISOString(),
    });
    mockedUpdateRequestStatus.mockResolvedValue({
      id: "79ca4c39-eb70-44b5-97b8-89ff205e1af0",
      provider: "gemini",
      status: "Resolvida",
      title: "Teste",
      description: "Teste",
      locationText: "Rua A",
      latitude: -20,
      longitude: -40,
      category: "Outros",
      priority: "Baixa",
      technicalSummary: "Resumo técnico válido para testes.",
      createdAt: new Date().toISOString(),
    });

    const req = {
      params: { id: "79ca4c39-eb70-44b5-97b8-89ff205e1af0" },
      body: { status: "Resolvida" },
    } as unknown as Request;
    const { res, status, json } = buildResponse();

    await updateRequestStatusController(req, res);

    expect(mockedUpdateRequestStatus).toHaveBeenCalledWith(
      "79ca4c39-eb70-44b5-97b8-89ff205e1af0",
      "Resolvida"
    );
    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ status: "Resolvida" })
    );
  });

  it("retorna 500 em erro inesperado", async () => {
    mockedFindRequestById.mockRejectedValue(new Error("falha inesperada"));

    const req = {
      params: { id: "79ca4c39-eb70-44b5-97b8-89ff205e1af0" },
      body: { status: "Cancelada" },
    } as unknown as Request;
    const { res, status, json } = buildResponse();

    await updateRequestStatusController(req, res);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalled();
  });
});
