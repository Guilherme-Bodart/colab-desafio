import { db } from "../../../db/client";

function normalizeCategoryName(name: string): string {
  return name.trim().toLowerCase();
}

export async function findOrCreateCategory(name: string): Promise<{
  id: number;
  name: string;
}> {
  const normalized = normalizeCategoryName(name);

  const existing = await db.query(
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

  const inserted = await db.query(
    `
      INSERT INTO categories (name, normalized_name)
      VALUES ($1, $2)
      ON CONFLICT (normalized_name)
      DO UPDATE SET name = categories.name
      RETURNING id, name
    `,
    [name.trim(), normalized]
  );

  return {
    id: inserted.rows[0].id,
    name: inserted.rows[0].name,
  };
}
