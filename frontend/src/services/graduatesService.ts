import type { Graduate, PaginatedResponse, FilterParams } from "@shared/types";
import { ApiClient } from "./apiClient";

class GraduatesService {
  async getGraduates(
    params: FilterParams,
  ): Promise<PaginatedResponse<Graduate>> {
    const query = new URLSearchParams();
    if (params.page) query.append("page", params.page.toString());
    if (params.pageSize) query.append("limit", params.pageSize.toString());
    if (params.search) query.append("search", params.search);
    if (params.shiurYear) {
      const year = Array.isArray(params.shiurYear)
        ? params.shiurYear.join(",")
        : params.shiurYear;
      query.append("shiur_year", year);
    }
    if (params.sortBy) query.append("sort_by", params.sortBy);
    if (params.order) query.append("order", params.order);

    return ApiClient.get<PaginatedResponse<Graduate>>(
      `/graduates?${query.toString()}`,
    );
  }

  async getGraduateById(id: string): Promise<Graduate> {
    return ApiClient.get<Graduate>(`/graduates/${id}`);
  }

  async createGraduate(graduate: Omit<Graduate, "id">): Promise<Graduate> {
    return ApiClient.post<Graduate>("/graduates", graduate);
  }

  async updateGraduate(
    id: string,
    updates: Partial<Graduate>,
  ): Promise<Graduate> {
    return ApiClient.put<Graduate>(`/graduates/${id}`, updates);
  }

  async deleteGraduate(id: string): Promise<void> {
    return ApiClient.delete<void>(`/graduates/${id}`);
  }

  async getGraduateYears(): Promise<{ shiur_year: string; count: number }[]> {
    return ApiClient.get<{ shiur_year: string; count: number }[]>(
      "/graduates/years",
    );
  }
}

export const graduatesService = new GraduatesService();
