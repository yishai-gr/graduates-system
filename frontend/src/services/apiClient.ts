import type { ApiError } from "@shared/types";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

interface RequestOptions extends RequestInit {
  skipAuth?: boolean;
}

export class ApiClient {
  private static async request<T>(
    endpoint: string,
    options: RequestOptions = {},
  ): Promise<T> {
    const { skipAuth, headers, ...rest } = options;

    const authHeaders: HeadersInit = {};
    if (!skipAuth) {
      const token = localStorage.getItem("auth_token");
      if (token) {
        authHeaders["Authorization"] = `Bearer ${token}`;
      }
    }

    const config: RequestInit = {
      ...rest,
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
        ...headers,
      },
    };

    try {
      const response = await fetch(`${API_URL}${endpoint}`, config);

      if (!response.ok) {
        // Try to parse error response
        let errorData: any;
        try {
          errorData = await response.json();
        } catch {
          errorData = { message: response.statusText };
        }

        const error: ApiError = {
          message:
            errorData?.error?.message ||
            errorData?.message ||
            "An unexpected error occurred",
          code: errorData?.error?.code || response.status.toString(),
        };

        if (response.status === 401) {
          // Handle unauthorized generally ?
          // For now just throw, UI should catch and redirect
        }

        throw error;
      }

      // Handle 204 No Content
      if (response.status === 204) {
        return {} as T;
      }

      return response.json();
    } catch (error) {
      // Network errors or other issues
      if ((error as any).message) {
        throw error;
      }
      throw {
        message: "Network error or server unreachable",
        code: "NETWORK_ERROR",
      } as ApiError;
    }
  }

  static get<T>(endpoint: string, options?: RequestOptions) {
    return this.request<T>(endpoint, { ...options, method: "GET" });
  }

  static post<T>(endpoint: string, data: any, options?: RequestOptions) {
    return this.request<T>(endpoint, {
      ...options,
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  static put<T>(endpoint: string, data: any, options?: RequestOptions) {
    return this.request<T>(endpoint, {
      ...options,
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  static delete<T>(endpoint: string, options?: RequestOptions) {
    return this.request<T>(endpoint, { ...options, method: "DELETE" });
  }
}
