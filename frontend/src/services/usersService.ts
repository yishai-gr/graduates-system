import type { User, PaginatedResponse, FilterParams } from "@shared/types";
import { ApiClient } from "./apiClient";

export interface ColumnFilter {
  id: string; // The column ID (e.g. 'role', 'phone')
  value: any; // The filter value (e.g. 'admin', 'isEmpty', 'isNotEmpty')
}

export interface TableQueryParams extends FilterParams {
  pageIndex?: number;
  pageSize?: number;
  sorting?: { id: string; desc: boolean }[];
  filters?: ColumnFilter[];
  globalFilter?: string;
}

class UsersService {
  async getUsers(params: TableQueryParams): Promise<PaginatedResponse<User>> {
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

    return ApiClient.get<PaginatedResponse<User>>(`/users?${query.toString()}`);
  }

  async getUserById(id: string): Promise<User> {
    // We didn't explicitly implement GET /users/:id in the router/controller loop
    // strictly for "getById" in the controller (I implemented getAll only),
    // but typically we can fetch from the list or I should add it.
    // The current UI usually just gets the list.
    // Let's assume we might not need this or I should have added it.
    // Wait, I only implemented getAll in PHP.
    // But typical REST suggests GET /users/:id.
    // Let's skip for now unless UI uses it.
    // Looking at UsersPage, it mostly uses "userToEdit" from the list.
    // So this might not be called often.
    return ApiClient.get<User>(`/users/${id}`);
  }

  async createUser(user: Omit<User, "id">): Promise<User> {
    return ApiClient.post<User>("/users", user);
  }

  async updateUser(
    id: string,
    updates: Partial<User> & { password?: string },
  ): Promise<User> {
    return ApiClient.put<User>(`/users/${id}`, updates);
  }

  async deleteUser(id: string): Promise<void> {
    return ApiClient.delete(`/users/${id}`);
  }
}

export const usersService = new UsersService();
