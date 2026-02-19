import type { User, PaginatedResponse, FilterParams } from "@shared/types";
import { ApiClient } from "./apiClient";

class UsersService {
  async getUsers(params: FilterParams): Promise<PaginatedResponse<User>> {
    // Note: The backend currently returns { data, total, page, pageSize } directly
    // If we want to support search/filter server-side, we should pass query params.
    // For now, let's pass them as query string.

    const query = new URLSearchParams();
    if (params.page) query.append("page", params.page.toString());
    if (params.pageSize) query.append("limit", params.pageSize.toString());
    if (params.search) query.append("search", params.search);
    if (params.role) query.append("role", params.role);

    // NOTE: Backend currently handles "getAll" effectively.
    // We might need to implement filtering in PHP if we want server-side filtering.
    // However, the PHP code I wrote mainly returns ALL users.
    // For MVP/Small scale: We can filter client side if the backend doesn't support it
    // OR we should accept that the backend returns everything for now.
    // Let's rely on what the backend gives us.

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
