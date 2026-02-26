import type { Graduate, PaginatedResponse } from "@shared/types";
import { ApiClient } from "./apiClient";

import { type TableQueryParams } from "./usersService";

class GraduatesService {
  async getGraduates(
    params: TableQueryParams,
  ): Promise<PaginatedResponse<Graduate>> {
    const query = new URLSearchParams();

    if (params.pageIndex !== undefined)
      query.append("page", String(params.pageIndex + 1));
    else if (params.page !== undefined)
      query.append("page", String(params.page));

    if (params.pageSize) query.append("limit", String(params.pageSize));

    if (params.sorting?.length) {
      query.append("sort", params.sorting[0].id);
      query.append("order", params.sorting[0].desc ? "desc" : "asc");
    }

    if (params.globalFilter) {
      query.append("search", params.globalFilter);
    } else if (params.search) {
      query.append("search", params.search);
    }

    if (params.filters && params.filters.length > 0) {
      query.append("filters", JSON.stringify(params.filters));
    }

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

  async getGraduateYears(params?: {
    filters?: import("./usersService").ColumnFilter[];
    globalFilter?: string;
  }): Promise<{ shiur_year: string; count: number }[]> {
    const query = new URLSearchParams();
    if (params?.filters?.length)
      query.append("filters", JSON.stringify(params.filters));
    if (params?.globalFilter) query.append("search", params.globalFilter);
    return ApiClient.get<{ shiur_year: string; count: number }[]>(
      `/graduates/years?${query.toString()}`,
    );
  }

  async getGraduateCities(params?: {
    filters?: import("./usersService").ColumnFilter[];
    globalFilter?: string;
  }): Promise<{ city: string; count: number }[]> {
    const query = new URLSearchParams();
    if (params?.filters?.length)
      query.append("filters", JSON.stringify(params.filters));
    if (params?.globalFilter) query.append("search", params.globalFilter);
    return ApiClient.get<{ city: string; count: number }[]>(
      `/graduates/cities?${query.toString()}`,
    );
  }
  async getGraduateFieldCounts(params?: {
    filters?: import("./usersService").ColumnFilter[];
    globalFilter?: string;
  }): Promise<Record<string, { empty: number; notEmpty: number }>> {
    const query = new URLSearchParams();
    if (params?.filters?.length)
      query.append("filters", JSON.stringify(params.filters));
    if (params?.globalFilter) query.append("search", params.globalFilter);
    return ApiClient.get<Record<string, { empty: number; notEmpty: number }>>(
      `/graduates/field-counts?${query.toString()}`,
    );
  }
}

export const graduatesService = new GraduatesService();
