import { db } from "../../../db/client";
import {
  normalizeCategoryName,
  resolveAllowedCategoryName,
} from "../category.constants";

export async function findAllowedCategory(name: string): Promise<{
  id: number;
  name: string;
}> {
  const resolvedName = resolveAllowedCategoryName(name);
  const normalized = normalizeCategoryName(resolvedName);

  const existing = await db.query<{ id: number; name: string }>(
    `
      SELECT id, name
      FROM categories
      WHERE normalized_name = $1
      LIMIT 1
    `,
    [normalized]
  );

  if (existing.rows[0]) {
    return {
      id: existing.rows[0].id,
      name: existing.rows[0].name,
    };
  }

  throw new Error(
    `Categoria permitida não encontrada na base: "${resolvedName}". Verifique initDatabase().`
  );
}

export const findOrCreateCategory = findAllowedCategory;
