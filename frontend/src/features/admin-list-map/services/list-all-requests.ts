import { listRequests } from "@/src/features/admin-list/services/list-requests";
import type { AdminRequest, RequestStatus } from "@/src/types/request";

const batchSize = 1000;

type MapRequestFilters = {
  search?: string;
  category?: string;
  priority?: string;
  status?: RequestStatus;
};

export async function listAllRequests(filters: MapRequestFilters): Promise<{
  data: AdminRequest[];
  total: number;
}> {
  const allItems: AdminRequest[] = [];
  let page = 1;
  let total = 0;
  let totalPages = 1;

  do {
    const response = await listRequests({
      page,
      limit: batchSize,
      search: filters.search,
      category: filters.category,
      priority: filters.priority,
      status: filters.status,
    });

    allItems.push(...response.data);
    total = response.pagination.total;
    totalPages = response.pagination.totalPages;
    page += 1;
  } while (page <= totalPages);

  return {
    data: allItems,
    total,
  };
}
