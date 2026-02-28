import type { Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AIProviderError } from "../src/modules/requests/errors/ai-provider.error";
import { createRequestController } from "../src/modules/requests/controllers/create-request.controller";
import { createRequestRecord } from "../src/modules/requests/repositories/request.repository";
import { normalizeLocationText } from "../src/modules/requests/services/location-normalizer.service";
import { processCitizenRequest } from "../src/modules/requests/services/triage.service";

vi.mock("../src/modules/requests/repositories/request.repository", () => ({
  createRequestRecord: vi.fn(),
}));

vi.mock("../src/modules/requests/services/location-normalizer.service", () => ({
  normalizeLocationText: vi.fn(),
}));

vi.mock("../src/modules/requests/services/triage.service", () => ({
  processCitizenRequest: vi.fn(),
}));

const mockedCreateRequestRecord = vi.mocked(createRequestRecord);
const mockedNormalizeLocationText = vi.mocked(normalizeLocationText);
const mockedProcessCitizenRequest = vi.mocked(processCitizenRequest);

function buildResponse() {
  const json = vi.fn();
  const status = vi.fn().mockReturnValue({ json });
  return { res: { status } as unknown as Response, status, json };
}

function buildValidRequestBody() {
  return {
    title: "Buraco grande na via",
    description: "Existe um buraco profundo na rua principal.",
    locationText: "Rua A, 100",
    latitude: -20.31,
    longitude: -40.29,
  };
}

describe("createRequestController", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retorna 400 para payload inválido", async () => {
    const req = {
      body: {
        title: "",
      },
    } as unknown as Request;
    const { res, status, json } = buildResponse();

    await createRequestController(req, res);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalled();
  });

  it("retorna 503 quando serviço de IA falha com AIProviderError", async () => {
    mockedNormalizeLocationText.mockResolvedValue("Rua A, 100 - Centro");
    mockedProcessCitizenRequest.mockRejectedValue(
      new AIProviderError({
        provider: "gemini",
        statusCode: 503,
        message: "Falha ao processar classificacao com Gemini",
        detail: "429 Too Many Requests",
      })
    );

    const req = { body: buildValidRequestBody() } as unknown as Request;
    const { res, status, json } = buildResponse();

    await createRequestController(req, res);

    expect(status).toHaveBeenCalledWith(503);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: "gemini",
        detail: "429 Too Many Requests",
      })
    );
    expect(mockedCreateRequestRecord).not.toHaveBeenCalled();
  });

  it("retorna 500 em erro inesperado", async () => {
    mockedNormalizeLocationText.mockResolvedValue("Rua A, 100 - Centro");
    mockedProcessCitizenRequest.mockResolvedValue({
      category: "Outros",
      priority: "Baixa",
      technicalSummary:
        "Falha pontual resultando em baixo impacto operacional. Necessário encaminhamento para avaliação técnica.",
    });
    mockedCreateRequestRecord.mockRejectedValue(new Error("db offline"));

    const req = { body: buildValidRequestBody() } as unknown as Request;
    const { res, status, json } = buildResponse();

    await createRequestController(req, res);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Erro interno ao salvar solicitação",
      })
    );
  });
});
