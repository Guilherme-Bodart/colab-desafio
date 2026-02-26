export type RequestPayload = {
  title: string;
  description: string;
  locationText: string;
  latitude: number | null;
  longitude: number | null;
};

export type ApiResponse = {
  id: string;
  provider: string;
  status: RequestStatus;
  category: string;
  priority: string;
  technicalSummary: string;
};

export type RequestStatus = "Pendente" | "Resolvida" | "Cancelada";

export type AdminRequest = {
  id: string;
  provider: string;
  status: RequestStatus;
  title: string;
  description: string;
  locationText: string;
  latitude: number;
  longitude: number;
  category: string;
  priority: string;
  technicalSummary: string;
  createdAt: string;
};

export type ListRequestsResponse = {
  data: AdminRequest[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type RejectedRequestResponse = {
  accepted: false;
  provider: string;
  message: string;
};
