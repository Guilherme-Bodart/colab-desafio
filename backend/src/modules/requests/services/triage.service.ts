import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";
import { env } from "../../../config/env";
import type { CreateRequestInput, TriageResult } from "../requests.types";

const zeladoriaSchema = z.object({
  category: z.enum([
    "Limpeza Urbana e Manejo de Resíduos",
    "Manutenção de Áreas Verdes e Paisagismo",
    "Infraestrutura e Conservação do Mobiliário Urbano",
    "Drenagem e Saneamento",
    "Poluição Visual e Ambiental",
    "Controle de Zoonoses e Pragas",
    "Outros",
  ]),
  priority: z.enum(["Alta", "Média", "Baixa"]),
  technicalSummary: z.string().min(10).max(300),
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
Você é um engenheiro civil e gestor público especialista em triagem de zeladoria urbana.
Analise o seguinte relato de um cidadão e classifique o problema com precisão técnica.

RELATO DO CIDADÃO:
Título: ${input.title}
Descrição: ${input.description}

---
INSTRUÇÕES DETALHADAS PARA CLASSIFICAÇÃO:

1. **CATEGORIA** (escolha EXCLUSIVAMENTE UMA, focando na CAUSA-RAIZ):
   - "Limpeza Urbana e Manejo de Resíduos": lixo doméstico, entulho, varrição. (Nota: Se lixo atrai pragas, a raiz é Limpeza).
   - "Manutenção de Áreas Verdes e Paisagismo": poda de árvores, capinação, mato alto.
   - "Infraestrutura e Conservação do Mobiliário Urbano": buracos no asfalto, calçadas, iluminação pública, sinalização, semáforos, placas.
   - "Drenagem e Saneamento": vazamentos, bueiros entupidos, alagamentos, esgoto. (Nota: Se água parada atrai mosquito, a raiz é Drenagem).
   - "Poluição Visual e Ambiental": pichações, cartazes irregulares.
   - "Controle de Zoonoses e Pragas": infestações diretas de vetores sem causa óbvia de infraestrutura.
   - "Outros": apenas se não se encaixar nas anteriores.

2. **PRIORIDADE** (Calibre rigorosamente pelo risco):
   - "Alta": Risco IMEDIATO à vida, segurança ou trânsito (ex: semáforo apagado, árvore caída na via, buraco profundo, esgoto jorrando, bueiro sem tampa).
   - "Média": Incômodo crônico ou falha sem risco imediato (ex: mato alto estético, buraco raso, poste isolado apagado, calçada irregular, acúmulo de lixo que não fecha a rua).
   - "Baixa": Melhorias estéticas ou problemas muito menores (ex: pichação, placa levemente torta).

3. **RESUMO TÉCNICO** (Máximo de 2 frases):
   - Formato obrigatório: [Problema técnico] resultando em [consequência operacional/de risco]. Necessário [ação da prefeitura].
   - Seja formal, impessoal e acionável para a equipe de campo.

---
REGRAS DE OURO:
- Galho ou árvore bloqueando faixa de rolamento = Prioridade ALTA.
- Lâmpada queimada isolada = Prioridade MÉDIA.
- Falha completa de semáforo = Prioridade ALTA.

Retorne APENAS um objeto JSON válido.
EXEMPLO DE SAÍDA:
{
  "category": "Infraestrutura e Conservação do Mobiliário Urbano",
  "priority": "Alta",
  "technicalSummary": "Buraco profundo no leito carroçável representa risco iminente de acidentes, especialmente para motociclistas. Necessário reparo emergencial com massa asfáltica."
}
`.trim();

  try {
    const result = await model.generateContent(prompt);
    let responseText = result.response.text();

    responseText = responseText
      .replace(/```json\s*/gi, "")
      .replace(/```\s*/g, "")
      .trim();

    if (!responseText.startsWith("{") || !responseText.endsWith("}")) {
      console.warn("Resposta mal formatada:", responseText);
      throw new Error("Resposta não é um JSON válido");
    }

    const parsedJson = JSON.parse(responseText);
    return zeladoriaSchema.parse(parsedJson);
  } catch (error) {
    console.error("Falha na formatação ou validação com IA:", error);
    throw new Error(
      "Não foi possível processar o relato automaticamente no momento."
    );
  }
}
