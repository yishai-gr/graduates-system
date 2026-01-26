import type { ApiError } from "@/types";

export const DELAY_MS = 500;

export async function delay(ms: number = DELAY_MS): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class MockService {
  protected storageKey: string;

  constructor(storageKey: string) {
    this.storageKey = storageKey;
  }

  protected getStoredData<T>(): T[] {
    const data = localStorage.getItem(this.storageKey);
    return data ? JSON.parse(data) : [];
  }

  protected setStoredData<T>(data: T[]): void {
    localStorage.setItem(this.storageKey, JSON.stringify(data));
  }
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

export function simulateApiError(
  message: string = "Something went wrong",
): never {
  const error: ApiError = { message };
  throw error;
}
