import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";
import { env } from "../../../config/env";
import type { CreateRequestInput, TriageResult } from "../requests.types";

const zeladoriaSchema = z.object({
  category: z.enum([
    "Limpeza Urbana e Manejo de Residuos",
    "Manutencao de Areas Verdes e Paisagismo",
    "Infraestrutura e Conservacao do Mobiliario Urbano",
    "Drenagem e Saneamento",
    "Poluicao Visual e Ambiental",
    "Controle de Zoonoses e Pragas",
    "Outros",
  ]),
  priority: z.enum(["Alta", "Media", "Baixa"]),
  technicalSummary: z.string().min(1),
});

const genAI = new GoogleGenerativeAI(env.geminiApiKey);

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
Voce e um engenheiro civil especialista em triagem de zeladoria urbana.
Analise o seguinte relato de um cidadao e classifique o problema.

Relato:
Titulo: ${input.title}
Descricao: ${input.description}

Retorne APENAS um objeto JSON valido, sem NENHUM texto antes ou depois, com as seguintes chaves e regras:
- "category": escolha EXCLUSIVAMENTE entre ["Limpeza Urbana e Manejo de Residuos", "Manutencao de Areas Verdes e Paisagismo", "Infraestrutura e Conservacao do Mobiliario Urbano", "Drenagem e Saneamento", "Poluicao Visual e Ambiental", "Controle de Zoonoses e Pragas", "Outros"].
- "priority": escolha EXCLUSIVAMENTE entre ["Alta", "Media", "Baixa"].
- "technicalSummary": crie um resumo tecnico do problema em 1 frase.
`.trim();

  try {
    const result = await model.generateContent(prompt);
    let responseText = result.response.text();

    responseText = responseText
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    const parsedJson = JSON.parse(responseText);
    const validatedData = zeladoriaSchema.parse(parsedJson);

    return validatedData;
  } catch (error) {
    console.error("Falha na formatacao ou validacao:", error);
    throw new Error("Falha Gemini: Nao foi possivel processar o relato automaticamente.");
  }
}
