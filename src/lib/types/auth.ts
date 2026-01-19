// User roles matching backend
export const UserRole = {
  ADMIN: 'ADMIN',
  TEACHER: 'TEACHER',
  STUDENT: 'STUDENT',
} as const;

export type UserRole = typeof UserRole[keyof typeof UserRole];

// User data
export interface User {
  user_id: string;
  username: string;
  email: string;
  full_name: string;
  role: UserRole;
}

// Login
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user_id: string;
  username: string;
  role: UserRole;
  email: string;
  full_name: string;
}

// Register
export interface RegisterRequest {
  username: string;
  password: string;
  full_name: string;
  role: UserRole;
  email: string;
}

export interface RegisterResponse {
  access_token: string;
  refresh_token: string;
  user_id: string;
  username: string;
  role: UserRole;
  email: string;
  full_name: string;
}

// Get current user (me)
export interface GetMeResponse {
  username: string;
  role: UserRole;
  user_id: string;
  email: string;
  full_name: string;
  exp: number;
}

// Refresh tokens
export interface RefreshTokensRequest {
  refresh_token: string;
}

export interface RefreshTokensResponse {
  access_token: string;
  refresh_token: string;
  user_id: string;
  username: string;
  full_name: string;
  role: UserRole;
  email: string;
}

// Auth state
export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// Storage keys
export const AUTH_STORAGE_KEYS = {
  ACCESS_TOKEN: 'ielts_access_token',
  REFRESH_TOKEN: 'ielts_refresh_token',
  USER: 'ielts_user',
} as const;

