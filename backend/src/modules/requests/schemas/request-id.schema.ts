import { z } from "zod";

export const requestIdSchema = z.object({
  id: z.string().uuid("ID inválido"),
});
