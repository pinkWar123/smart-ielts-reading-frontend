import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  GetMeResponse,
  RefreshTokensRequest,
  RefreshTokensResponse,
} from '../types/auth';

// API base URL - can be configured via environment variable
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
const AUTH_API_PREFIX = '/api/v1/auth';

// Custom error class for API errors
export class AuthApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code?: string
  ) {
    super(message);
    this.name = 'AuthApiError';
  }
}

// Helper to handle API responses
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = 'An error occurred';
    let errorCode: string | undefined;

    try {
      const errorData = await response.json();
      errorMessage = errorData.detail || errorData.message || errorMessage;
      errorCode = errorData.code;
    } catch {
      // If response is not JSON, use status text
      errorMessage = response.statusText || errorMessage;
    }

    throw new AuthApiError(errorMessage, response.status, errorCode);
  }

  return response.json();
}

// Auth API functions
export const authApi = {
  /**
   * Login with username and password
   */
  async login(data: LoginRequest): Promise<LoginResponse> {
    const response = await fetch(`${API_BASE_URL}${AUTH_API_PREFIX}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    return handleResponse<LoginResponse>(response);
  },

  /**
   * Register a new user
   */
  async register(data: RegisterRequest): Promise<RegisterResponse> {
    const response = await fetch(`${API_BASE_URL}${AUTH_API_PREFIX}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    return handleResponse<RegisterResponse>(response);
  },

  /**
   * Get current user profile
   */
  async getMe(accessToken: string): Promise<GetMeResponse> {
    const response = await fetch(`${API_BASE_URL}${AUTH_API_PREFIX}/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return handleResponse<GetMeResponse>(response);
  },

  /**
   * Refresh access token using refresh token
   */
  async refreshTokens(data: RefreshTokensRequest): Promise<RefreshTokensResponse> {
    const response = await fetch(`${API_BASE_URL}${AUTH_API_PREFIX}/refresh-tokens`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    return handleResponse<RefreshTokensResponse>(response);
  },
};

export default authApi;

