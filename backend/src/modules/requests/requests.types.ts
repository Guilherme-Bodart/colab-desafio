export type CreateRequestInput = {
  title: string;
  description: string;
  locationText: string;
  latitude: number;
  longitude: number;
};

export type ProcessedRequest = CreateRequestInput & {
  id: string;
  category: string;
  priority: string;
  technicalSummary: string;
  createdAt: string;
};
