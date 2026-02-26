export type CreateRequestInput = {
  title: string;
  description: string;
  locationText: string;
  latitude: number;
  longitude: number;
};

export type RequestStatus = "Pendente" | "Resolvida" | "Cancelada";

export type TriageResult = {
  category:
    | "Limpeza Urbana e Manejo de Resíduos"
    | "Manutenção de Áreas Verdes e Paisagismo"
    | "Infraestrutura e Conservação do Mobiliário Urbano"
    | "Drenagem e Saneamento"
    | "Poluição Visual e Ambiental"
    | "Controle de Zoonoses e Pragas"
    | "Outros";
  priority: "Alta" | "Média" | "Baixa";
  technicalSummary: string;
};

export type TriagePersistedFields = {
  category: string;
  priority: string;
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
  category?: string;
  priority?: string;
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
