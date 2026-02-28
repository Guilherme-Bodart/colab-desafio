import { beforeEach, describe, expect, it, vi } from "vitest";

const geminiMocks = vi.hoisted(() => {
  const generateContentMock = vi.fn();
  const getGenerativeModelMock = vi.fn(() => ({
    generateContent: generateContentMock,
  }));

  return {
    generateContentMock,
    getGenerativeModelMock,
  };
});

vi.mock("@google/generative-ai", () => ({
  GoogleGenerativeAI: class GoogleGenerativeAI {
    getGenerativeModel = geminiMocks.getGenerativeModelMock;
  },
}));

describe("processCitizenRequest", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();

    process.env.DATABASE_URL = "postgres://local/test";
    process.env.GEMINI_API_KEY = "test-gemini-key";
    process.env.GEMINI_MODEL = "gemini-test-model";
  });

  it("faz retry em erro transitório da IA e conclui na terceira tentativa", async () => {
    geminiMocks.generateContentMock
      .mockRejectedValueOnce(new Error("429 Too many requests"))
      .mockRejectedValueOnce(new Error("503 Service Unavailable"))
      .mockResolvedValueOnce({
        response: {
          text: () =>
            JSON.stringify({
              category: "Outros",
              priority: "Baixa",
              technicalSummary:
                "Demanda sem risco imediato resultando em impacto operacional baixo. Necessário encaminhamento para avaliação técnica.",
            }),
        },
      });

    const { processCitizenRequest } = await import(
      "../src/modules/requests/services/triage.service"
    );

    const result = await processCitizenRequest({
      title: "Solicitação de ajuste",
      description: "Necessário pequeno ajuste sem risco imediato.",
      locationText: "Rua Exemplo, 123",
      latitude: -20.31,
      longitude: -40.29,
    });

    expect(result).toEqual({
      category: "Outros",
      priority: "Baixa",
      technicalSummary:
        "Demanda sem risco imediato resultando em impacto operacional baixo. Necessário encaminhamento para avaliação técnica.",
    });
    expect(geminiMocks.getGenerativeModelMock).toHaveBeenCalledTimes(1);
    expect(geminiMocks.generateContentMock).toHaveBeenCalledTimes(3);
  });
});
