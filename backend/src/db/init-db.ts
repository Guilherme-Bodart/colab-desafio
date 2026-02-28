import { db } from "./client";
import {
  ALLOWED_CATEGORY_NAMES,
  normalizeCategoryName,
} from "../modules/categories/category.constants";

export async function initDatabase() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS categories (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      normalized_name TEXT NOT NULL UNIQUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS requests (
      id UUID PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      location_text TEXT NOT NULL,
      latitude DOUBLE PRECISION NOT NULL,
      longitude DOUBLE PRECISION NOT NULL,
      category TEXT,
      category_id INTEGER REFERENCES categories(id),
      status TEXT NOT NULL DEFAULT 'Pendente',
      priority TEXT NOT NULL,
      technical_summary TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await db.query(`
    ALTER TABLE requests
    ADD COLUMN IF NOT EXISTS category_id INTEGER REFERENCES categories(id);
  `);

  await db.query(`
    ALTER TABLE requests
    ADD COLUMN IF NOT EXISTS category TEXT;
  `);

  await db.query(`
    ALTER TABLE requests
    ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'Pendente';
  `);

  await db.query(`
    ALTER TABLE requests
    ALTER COLUMN category DROP NOT NULL;
  `);

  for (const category of ALLOWED_CATEGORY_NAMES) {
    await db.query(
      `
        INSERT INTO categories (name, normalized_name)
        VALUES ($1, $2)
        ON CONFLICT (normalized_name) DO NOTHING;
      `,
      [category, normalizeCategoryName(category)]
    );
  }

  const categoryColumn = await db.query<{ exists: boolean }>(
    `
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'requests' AND column_name = 'category'
      ) AS exists
    `
  );

  if (categoryColumn.rows[0]?.exists) {
    await db.query(`
      UPDATE requests r
      SET category_id = c.id
      FROM categories c
      WHERE r.category_id IS NULL
        AND LOWER(TRIM(r.category)) = c.normalized_name;
    `);

    await db.query(`
      UPDATE requests r
      SET category_id = c.id
      FROM categories c
      WHERE r.category_id IS NULL
        AND c.normalized_name = 'outros';
    `);
  }
}
