import type { AllowedCategoryName } from "../categories/category.constants";

export type CreateRequestInput = {
  title: string;
  description: string;
  locationText: string;
  latitude: number;
  longitude: number;
};

export type RequestStatus = "Pendente" | "Resolvida" | "Cancelada";
export const REQUEST_PRIORITIES = ["Alta", "Média", "Baixa"] as const;
export type RequestPriority = (typeof REQUEST_PRIORITIES)[number];

export type TriageResult = {
  category: AllowedCategoryName;
  priority: RequestPriority;
  technicalSummary: string;
};

export type TriagePersistedFields = {
  category: string;
  priority: RequestPriority;
  technicalSummary: string;
};

export type CreateRequestRecordInput = CreateRequestInput & TriagePersistedFields;

export type ProcessedRequest = CreateRequestRecordInput & {
  id: string;
  provider: "gemini";
  status: RequestStatus;
  createdAt: string;
};

export type ListRequestsFilters = {
  category?: AllowedCategoryName;
  priority?: RequestPriority;
  status?: RequestStatus;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  page: number;
  limit: number;
};

export type PaginatedRequestsResponse = {
  data: ProcessedRequest[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};
