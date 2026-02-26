import { z } from "zod";

function noCorruptedChar(value: string) {
  return !value.includes("\uFFFD");
}

export const createRequestSchema = z.object({
  title: z
    .string()
    .min(1, "Título obrigatório")
    .refine(noCorruptedChar, "Título com codificação inválida"),
  description: z
    .string()
    .min(1, "Descrição obrigatória")
    .refine(noCorruptedChar, "Descrição com codificação inválida"),
  locationText: z
    .string()
    .min(1, "Localização obrigatória")
    .refine(noCorruptedChar, "Localização com codificação inválida"),
  latitude: z.number(),
  longitude: z.number(),
});
