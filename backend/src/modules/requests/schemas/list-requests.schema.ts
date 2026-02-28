import { z } from "zod";
import { ALLOWED_CATEGORY_NAMES } from "../../categories/category.constants";
import { REQUEST_PRIORITIES } from "../requests.types";

export const listRequestsSchema = z.object({
  category: z.enum(ALLOWED_CATEGORY_NAMES).optional(),
  priority: z.enum(REQUEST_PRIORITIES).optional(),
  status: z.enum(["Pendente", "Resolvida", "Cancelada"]).optional(),
  search: z.string().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(1000).default(10),
});
