export type Role = "super_admin" | "shiur_manager";

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  shiurs?: string[]; // For shiur_manager: list of years they manage
}

export interface Graduate {
  id: string;
  // Managed by admin only
  student_code?: string;

  // Personal Info
  first_name: string;
  last_name: string;
  teudat_zehut?: string;
  birth_date?: string; // ISO date string or custom format (e.g., "DD/MM/YYYY")

  // Contact Info
  phone?: string;
  home_phone?: string;
  email?: string;

  // Address
  city?: string;
  address?: string; // Street and number

  // Affiliation
  shiur_year?: string; // The year they graduated/belong to. Can be null if not assigned yet.

  // General
  notes?: string;
  deletedAt?: string; // ISO date string, for soft delete
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface ApiError {
  message: string;
  code?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface FilterParams {
  page?: number;
  pageSize?: number;
  search?: string;
  [key: string]: any;
}
