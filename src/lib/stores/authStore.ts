import { create } from 'zustand';
import { authApi, AuthApiError } from '../api/auth';
import type {
  User,
  LoginRequest,
  RegisterRequest,
  UserRole,
} from '../types/auth';

// Storage keys
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'ielts_access_token',
  REFRESH_TOKEN: 'ielts_refresh_token',
  USER: 'ielts_user',
} as const;

interface AuthStore {
  // State
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;

  // Actions
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  refreshTokens: () => Promise<boolean>;
  initialize: () => Promise<void>;
  clearError: () => void;
  getAccessToken: () => string | null;
}

// Helper to save auth data to localStorage
const saveToStorage = (accessToken: string, refreshToken: string, user: User) => {
  localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
  localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
};

// Helper to clear auth data from localStorage
const clearStorage = () => {
  localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.USER);
};

// Helper to load auth data from localStorage
const loadFromStorage = (): {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
} => {
  const accessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  const userStr = localStorage.getItem(STORAGE_KEYS.USER);
  
  let user: User | null = null;
  if (userStr) {
    try {
      user = JSON.parse(userStr);
    } catch {
      // Invalid JSON, clear storage
      clearStorage();
    }
  }

  return { accessToken, refreshToken, user };
};

// Create user object from response
const createUserFromResponse = (response: {
  user_id: string;
  username: string;
  email: string;
  full_name: string;
  role: string;
}): User => ({
  user_id: response.user_id,
  username: response.username,
  email: response.email,
  full_name: response.full_name,
  role: response.role as UserRole,
});

export const useAuthStore = create<AuthStore>((set, get) => ({
  // Initial state
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,
  error: null,

  // Login action
  login: async (data: LoginRequest) => {
    set({ isLoading: true, error: null });

    try {
      const response = await authApi.login(data);
      const user = createUserFromResponse(response);

      // Save to storage
      saveToStorage(response.access_token, response.refresh_token, user);

      set({
        user,
        accessToken: response.access_token,
        refreshToken: response.refresh_token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (err) {
      const message =
        err instanceof AuthApiError
          ? err.message
          : 'Failed to login. Please try again.';

      set({
        isLoading: false,
        error: message,
      });

      throw err;
    }
  },

  // Register action
  register: async (data: RegisterRequest) => {
    set({ isLoading: true, error: null });

    try {
      const response = await authApi.register(data);
      const user = createUserFromResponse(response);

      // Save to storage
      saveToStorage(response.access_token, response.refresh_token, user);

      set({
        user,
        accessToken: response.access_token,
        refreshToken: response.refresh_token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (err) {
      const message =
        err instanceof AuthApiError
          ? err.message
          : 'Failed to register. Please try again.';

      set({
        isLoading: false,
        error: message,
      });

      throw err;
    }
  },

  // Logout action
  logout: () => {
    clearStorage();
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      error: null,
    });
  },

  // Refresh tokens action
  refreshTokens: async () => {
    const { refreshToken } = get();

    if (!refreshToken) {
      return false;
    }

    try {
      const response = await authApi.refreshTokens({ refresh_token: refreshToken });
      const user = createUserFromResponse(response);

      // Save to storage
      saveToStorage(response.access_token, response.refresh_token, user);

      set({
        user,
        accessToken: response.access_token,
        refreshToken: response.refresh_token,
        isAuthenticated: true,
      });

      return true;
    } catch {
      // Refresh failed, logout user
      get().logout();
      return false;
    }
  },

  // Initialize auth state from storage
  initialize: async () => {
    const { accessToken, refreshToken, user } = loadFromStorage();

    if (!accessToken || !refreshToken || !user) {
      set({ isInitialized: true });
      return;
    }

    // Set initial state from storage
    set({
      accessToken,
      refreshToken,
      user,
      isAuthenticated: true,
    });

    // Try to validate/refresh the token
    try {
      await authApi.getMe(accessToken);
      set({ isInitialized: true });
    } catch (err) {
      // Token might be expired, try to refresh
      if (err instanceof AuthApiError && err.statusCode === 401) {
        const success = await get().refreshTokens();
        if (!success) {
          // Refresh failed, user needs to login again
          get().logout();
        }
      } else {
        // Other error, keep the user logged in but mark as initialized
        console.error('Error validating token:', err);
      }
      set({ isInitialized: true });
    }
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  },

  // Get current access token (useful for API calls)
  getAccessToken: () => {
    return get().accessToken;
  },
}));

export default useAuthStore;

