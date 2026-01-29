import type {
  ImportPreviewResponse,
  ImportConfirmResponse,
  ImportConfirmRequest,
} from "@shared/types";
import { ApiClient } from "./apiClient";

class ImportService {
  async previewImport(file: File): Promise<ImportPreviewResponse> {
    const formData = new FormData();
    formData.append("file", file);

    const token = localStorage.getItem("auth_token");
    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

    try {
      const response = await fetch(
        `${API_URL}/graduates/import/preview`,
        {
          method: "POST",
          body: formData,
          headers, // Remove Content-Type to let browser set it with boundary
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData?.error || "Failed to preview import"
        );
      }

      return response.json();
    } catch (error) {
      throw error;
    }
  }

  async confirmImport(request: ImportConfirmRequest): Promise<ImportConfirmResponse> {
    return ApiClient.post<ImportConfirmResponse>(
      "/graduates/import/confirm",
      request
    );
  }
}

export const importService = new ImportService();
