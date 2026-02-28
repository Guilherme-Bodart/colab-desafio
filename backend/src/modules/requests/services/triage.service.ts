import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";
import { env } from "../../../config/env";
import { ALLOWED_CATEGORY_NAMES } from "../../categories/category.constants";
import { AIProviderError } from "../errors/ai-provider.error";
import {
  REQUEST_PRIORITIES,
  type CreateRequestInput,
  type TriageResult,
} from "../requests.types";

const zeladoriaSchema = z.object({
  category: z.enum(ALLOWED_CATEGORY_NAMES),
  priority: z.enum(REQUEST_PRIORITIES),
  technicalSummary: z.string().min(10).max(300),
});

const genAI = new GoogleGenerativeAI(env.geminiApiKey);
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_BASE_DELAY_MS = 350;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function stringifyError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

function isRetryableGeminiError(error: unknown): boolean {
  const message = stringifyError(error).toLowerCase();
  const retryableStatus =
    message.includes("429") ||
    message.includes("500") ||
    message.includes("502") ||
    message.includes("503") ||
    message.includes("504");

  if (retryableStatus) {
    return true;
  }

  return (
    message.includes("too many requests") ||
    message.includes("timeout") ||
    message.includes("timed out") ||
    message.includes("service unavailable") ||
    message.includes("network") ||
    message.includes("fetch failed") ||
    message.includes("econnreset") ||
    message.includes("etimedout") ||
    message.includes("eai_again") ||
    message.includes("enotfound")
  );
}

function resolveGeminiStatusCode(error: unknown): number {
  const message = stringifyError(error).toLowerCase();

  if (message.includes("429") || message.includes("too many requests")) {
    return 503;
  }

  return 502;
}

async function generateWithRetry(
  model: ReturnType<typeof genAI.getGenerativeModel>,
  prompt: string
): Promise<string> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_RETRY_ATTEMPTS; attempt += 1) {
    try {
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      lastError = error;
      const shouldRetry =
        attempt < MAX_RETRY_ATTEMPTS && isRetryableGeminiError(error);

      if (!shouldRetry) {
        break;
      }

      const delayMs = RETRY_BASE_DELAY_MS * 2 ** (attempt - 1);
      await sleep(delayMs);
    }
  }

  throw new AIProviderError({
    provider: "gemini",
    statusCode: resolveGeminiStatusCode(lastError),
    message: "Falha ao processar classificacao com Gemini",
    detail: stringifyError(lastError),
  });
}

export async function processCitizenRequest(
  input: CreateRequestInput
): Promise<TriageResult> {
  const model = genAI.getGenerativeModel({
    model: env.geminiModel,
    generationConfig: {
      temperature: 0,
    },
  });

  const prompt = `
VocÃª Ã© um engenheiro civil e gestor pÃºblico especialista em triagem de zeladoria urbana.
Analise o seguinte relato de um cidadÃ£o e classifique o problema com precisÃ£o tÃ©cnica.

RELATO DO CIDADÃƒO:
TÃ­tulo: ${input.title}
DescriÃ§Ã£o: ${input.description}

---
INSTRUÃ‡Ã•ES DETALHADAS PARA CLASSIFICAÃ‡ÃƒO:

1. **CATEGORIA** (escolha EXCLUSIVAMENTE UMA, focando na CAUSA-RAIZ):
   - "Limpeza Urbana e Manejo de ResÃ­duos": lixo domÃ©stico, entulho, varriÃ§Ã£o. (Nota: Se lixo atrai pragas, a raiz Ã© Limpeza).
   - "ManutenÃ§Ã£o de Ãreas Verdes e Paisagismo": poda de Ã¡rvores, capinaÃ§Ã£o, mato alto.
   - "Infraestrutura e ConservaÃ§Ã£o do MobiliÃ¡rio Urbano": buracos no asfalto, calÃ§adas, iluminaÃ§Ã£o pÃºblica, sinalizaÃ§Ã£o, semÃ¡foros, placas.
   - "Drenagem e Saneamento": vazamentos, bueiros entupidos, alagamentos, esgoto. (Nota: Se Ã¡gua parada atrai mosquito, a raiz Ã© Drenagem).
   - "PoluiÃ§Ã£o Visual e Ambiental": pichaÃ§Ãµes, cartazes irregulares.
   - "Controle de Zoonoses e Pragas": infestaÃ§Ãµes diretas de vetores sem causa Ã³bvia de infraestrutura.
   - "Outros": apenas se nÃ£o se encaixar nas anteriores ou pedidos para criar/instalar coisas NOVAS (ex: novo bicicletÃ¡rio, asfaltar rua de terra), intervenÃ§Ãµes artÃ­sticas, sugestÃµes de projetos ou qualquer relato que NÃƒO seja conserto/limpeza de algo jÃ¡ existente.

2. **PRIORIDADE** (Calibre rigorosamente pelo risco):
   - "Alta": Risco IMEDIATO Ã  vida, seguranÃ§a ou trÃ¢nsito (ex: semÃ¡foro apagado, Ã¡rvore caÃ­da na via, buraco profundo, esgoto jorrando, bueiro sem tampa).
   - "MÃ©dia": IncÃ´modo crÃ´nico ou falha sem risco imediato (ex: mato alto estÃ©tico, buraco raso, poste isolado apagado, calÃ§ada irregular, acÃºmulo de lixo que nÃ£o fecha a rua).
   - "Baixa": Melhorias estÃ©ticas ou problemas muito menores (ex: pichaÃ§Ã£o, placa levemente torta).

3. **RESUMO TÃ‰CNICO** (MÃ¡ximo de 2 frases):
   - Formato obrigatÃ³rio: [Problema tÃ©cnico] resultando em [consequÃªncia operacional/de risco]. NecessÃ¡rio [aÃ§Ã£o da prefeitura].
   - FaÃ§a uma reescrita formal e impessoal do problema, voltada para a leitura e tomada de decisÃ£o de um gestor pÃºblico.

---
REGRAS DE OURO:
- Galho ou Ã¡rvore bloqueando faixa de rolamento = Prioridade ALTA.
- LÃ¢mpada queimada isolada = Prioridade MÃ‰DIA.
- Falha completa de semÃ¡foro = Prioridade ALTA.
- Pedidos de NOVAS instalaÃ§Ãµes, obras do zero ou sugestÃµes (ex: "seria bom ter um bicicletÃ¡rio", "pintar um mural") DEVEM ir obrigatoriamente para a categoria "Outros" com prioridade "Baixa".

Retorne APENAS um objeto JSON vÃ¡lido.
EXEMPLO DE SAÃDA:
{
  "category": "Infraestrutura e ConservaÃ§Ã£o do MobiliÃ¡rio Urbano",
  "priority": "Alta",
  "technicalSummary": "Buraco profundo no leito carroÃ§Ã¡vel representa risco iminente de acidentes, especialmente para motociclistas. NecessÃ¡rio reparo emergencial com massa asfÃ¡ltica."
}
`.trim();

  try {
    let responseText = await generateWithRetry(model, prompt);

    responseText = responseText
      .replace(/```json\s*/gi, "")
      .replace(/```\s*/g, "")
      .trim();

    if (!responseText.startsWith("{") || !responseText.endsWith("}")) {
      console.warn("Resposta mal formatada:", responseText);
      throw new Error("Resposta nÃ£o Ã© um JSON vÃ¡lido");
    }

    const parsedJson = JSON.parse(responseText);
    return zeladoriaSchema.parse(parsedJson);
  } catch (error) {
    if (error instanceof AIProviderError) {
      throw error;
    }

    console.error("Falha na formataÃ§Ã£o ou validaÃ§Ã£o com IA:", error);
    throw new AIProviderError({
      provider: "gemini",
      statusCode: 502,
      message: "Falha ao processar classificacao com Gemini",
      detail: stringifyError(error),
    });
  }
}

