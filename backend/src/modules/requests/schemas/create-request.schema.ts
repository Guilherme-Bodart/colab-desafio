import { z } from "zod";

export const createRequestSchema = z.object({
  title: z.string().min(1, "Titulo obrigatorio"),
  description: z.string().min(1, "Descricao obrigatoria"),
  locationText: z.string().min(1, "Localizacao obrigatoria"),
  latitude: z.number(),
  longitude: z.number(),
});
