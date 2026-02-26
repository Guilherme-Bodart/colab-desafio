export type RequestPayload = {
  title: string;
  description: string;
  locationText: string;
  latitude: number | null;
  longitude: number | null;
};

export type ApiResponse = {
  id: string;
  category: string;
  priority: string;
  technicalSummary: string;
};
