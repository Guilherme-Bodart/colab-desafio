import { randomUUID } from "node:crypto";
import { db } from "../../../db/client";
import { findOrCreateCategory } from "../../categories/repositories/category.repository";
import type {
  CreateRequestRecordInput,
  ListRequestsFilters,
  PaginatedRequestsResponse,
  ProcessedRequest,
  RequestStatus,
} from "../requests.types";

function mapDbRowToProcessedRequest(row: any): ProcessedRequest {
  return {
    id: row.id,
    provider: "gemini",
    status: row.status,
    title: row.title,
    description: row.description,
    locationText: row.location_text,
    latitude: row.latitude,
    longitude: row.longitude,
    category: row.category_name,
    priority: row.priority,
    technicalSummary: row.technical_summary,
    createdAt: new Date(row.created_at).toISOString(),
  };
}

export async function createRequestRecord(
  input: CreateRequestRecordInput
): Promise<ProcessedRequest> {
  const id = randomUUID();
  const category = await findOrCreateCategory(input.category);

  const result = await db.query(
    `
      INSERT INTO requests (
        id, title, description, location_text, latitude, longitude,
        category, category_id, status, priority, technical_summary
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id, title, description, location_text, latitude, longitude,
                category_id, status, priority, technical_summary, created_at
    `,
    [
      id,
      input.title,
      input.description,
      input.locationText,
      input.latitude,
      input.longitude,
      category.name,
      category.id,
      "Pendente",
      input.priority,
      input.technicalSummary,
    ]
  );

  const row = result.rows[0];
  return {
    ...mapDbRowToProcessedRequest({
      ...row,
      category_name: category.name,
    }),
  };
}

export async function findRequestById(
  id: string
): Promise<ProcessedRequest | null> {
  const result = await db.query(
    `
      SELECT requests.id, title, description, location_text, latitude, longitude,
             c.name AS category_name, status, priority, technical_summary,
             requests.created_at
      FROM requests
      JOIN categories c ON c.id = requests.category_id
      WHERE requests.id = $1
    `,
    [id]
  );

  if (!result.rows[0]) {
    return null;
  }

  return mapDbRowToProcessedRequest(result.rows[0]);
}

export async function listRequests(
  filters: ListRequestsFilters
): Promise<PaginatedRequestsResponse> {
  const values: unknown[] = [];
  const conditions: string[] = [];

  if (filters.category) {
    values.push(filters.category);
    conditions.push(`c.normalized_name = LOWER(TRIM($${values.length}))`);
  }

  if (filters.priority) {
    values.push(filters.priority);
    conditions.push(`priority = $${values.length}`);
  }

  if (filters.status) {
    values.push(filters.status);
    conditions.push(`status = $${values.length}`);
  }

  if (filters.search) {
    values.push(`%${filters.search}%`);
    const param = `$${values.length}`;
    conditions.push(`location_text ILIKE ${param}`);
  }

  if (filters.dateFrom) {
    values.push(filters.dateFrom);
    conditions.push(`requests.created_at >= $${values.length}::timestamptz`);
  }

  if (filters.dateTo) {
    values.push(filters.dateTo);
    conditions.push(`requests.created_at <= $${values.length}::timestamptz`);
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const countResult = await db.query(
    `
      SELECT COUNT(*)::int AS total
      FROM requests
      JOIN categories c ON c.id = requests.category_id
      ${whereClause}
    `,
    values
  );
  const total = countResult.rows[0].total as number;

  const offset = (filters.page - 1) * filters.limit;
  values.push(filters.limit);
  values.push(offset);

  const dataResult = await db.query(
    `
      SELECT requests.id, title, description, location_text, latitude, longitude,
             c.name AS category_name, status, priority, technical_summary,
             requests.created_at
      FROM requests
      JOIN categories c ON c.id = requests.category_id
      ${whereClause}
      ORDER BY requests.created_at DESC
      LIMIT $${values.length - 1}
      OFFSET $${values.length}
    `,
    values
  );

  return {
    data: dataResult.rows.map(mapDbRowToProcessedRequest),
    pagination: {
      page: filters.page,
      limit: filters.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / filters.limit)),
    },
  };
}

export async function updateRequestStatus(
  id: string,
  status: RequestStatus
): Promise<ProcessedRequest | null> {
  const result = await db.query(
    `
      UPDATE requests
      SET status = $2
      WHERE id = $1
      RETURNING id, title, description, location_text, latitude, longitude,
                category_id, status, priority, technical_summary, created_at
    `,
    [id, status]
  );

  if (!result.rows[0]) {
    return null;
  }

  const categoryResult = await db.query(
    `SELECT name FROM categories WHERE id = $1`,
    [result.rows[0].category_id]
  );

  return mapDbRowToProcessedRequest({
    ...result.rows[0],
    category_name: categoryResult.rows[0]?.name ?? "Outros",
  });
}
