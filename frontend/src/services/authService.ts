import type { AuthResponse, User } from "@shared/types";
import { ApiClient } from "./apiClient";

class AuthService {
  async login(email: string, password?: string): Promise<AuthResponse> {
    return ApiClient.post<AuthResponse>("/auth/login", {
      email,
      password: password || "admin123", // Fallback for dev/legacy if needed, but UI should provide it
    }).then((res) => {
      localStorage.setItem("auth_token", res.token);
      localStorage.setItem("auth_user", JSON.stringify(res.user));
      return res;
    });
  }

  async logout(): Promise<void> {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
  }

  async getMe(): Promise<User | null> {
    const storedUser = localStorage.getItem("auth_user");
    // Optionally verify with backend:
    // return ApiClient.get<User>("/auth/me").catch(() => null);
    // For speed, return stored, or try backend:
    if (!storedUser) return null;

    try {
      const res = await ApiClient.get<{ user: User }>("/auth/me");
      return res.user;
    } catch {
      return JSON.parse(storedUser);
    }
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem("auth_token");
  }
}

export const authService = new AuthService();
