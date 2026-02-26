import { z } from "zod";

export const listRequestsSchema = z.object({
  category: z.string().optional(),
  priority: z.string().optional(),
  status: z.enum(["Pendente", "Resolvida", "Cancelada"]).optional(),
  search: z.string().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});
