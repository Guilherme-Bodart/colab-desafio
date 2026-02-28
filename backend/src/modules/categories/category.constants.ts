export const ALLOWED_CATEGORY_NAMES = [
  "Limpeza Urbana e Manejo de Resíduos",
  "Manutenção de Áreas Verdes e Paisagismo",
  "Infraestrutura e Conservação do Mobiliário Urbano",
  "Drenagem e Saneamento",
  "Poluição Visual e Ambiental",
  "Controle de Zoonoses e Pragas",
  "Outros",
] as const;

export type AllowedCategoryName = (typeof ALLOWED_CATEGORY_NAMES)[number];

export const DEFAULT_CATEGORY_NAME: AllowedCategoryName = "Outros";

export function normalizeCategoryName(name: string): string {
  return name.trim().toLowerCase();
}

function normalizeCategoryAlias(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

const allowedByNormalized = new Map<string, AllowedCategoryName>(
  ALLOWED_CATEGORY_NAMES.map((category) => [
    normalizeCategoryAlias(category),
    category,
  ])
);

export function resolveAllowedCategoryName(name: string): AllowedCategoryName {
  const normalized = normalizeCategoryAlias(name);
  return allowedByNormalized.get(normalized) ?? DEFAULT_CATEGORY_NAME;
}
