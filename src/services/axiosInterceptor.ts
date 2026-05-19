import axios, { type AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import { apiClient } from '@/services/apiClient';
import { tokenStorage } from '@/services/tokenStorage';
import { emitAuthExpired } from '@/services/authEvents';

type RefreshResponse = {
  user: unknown;
  tokens: {
    accessToken: string;
    accessTokenExpiresAt: string;
    refreshToken: string;
    refreshTokenExpiresAt: string;
  };
};

let refreshing: Promise<string | null> | null = null;

const createRefreshClient = (baseURL: string | undefined) =>
  axios.create({
    baseURL: baseURL ?? '',
    headers: { 'Content-Type': 'application/json' },
  });

const refreshAccessToken = async (): Promise<string | null> => {
  const rt = tokenStorage.getRefreshToken();
  if (!rt) return null;

  const bare = createRefreshClient(apiClient.defaults.baseURL);
  try {
    const { data } = await bare.post<RefreshResponse>('/api/auth/refresh', { refreshToken: rt });
    tokenStorage.setTokens(
      data.tokens.accessToken,
      data.tokens.refreshToken,
      data.tokens.accessTokenExpiresAt,
      data.tokens.refreshTokenExpiresAt,
    );
    return data.tokens.accessToken;
  } catch {
    tokenStorage.clearTokens();
    emitAuthExpired();
    return null;
  }
};

const getRefreshingPromise = () => {
  if (!refreshing) {
    refreshing = refreshAccessToken().finally(() => {
      refreshing = null;
    });
  }
  return refreshing;
};

const shouldSkipAuth = (url: string | undefined) =>
  !!url && (url.includes('/api/auth/login') || url.includes('/api/auth/refresh'));

export const attachInterceptors = (client: AxiosInstance) => {
  client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    } else if (config.headers['Content-Type'] === undefined) {
      config.headers['Content-Type'] = 'application/json';
    }
    if (shouldSkipAuth(config.url)) return config;
    const token = tokenStorage.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
      const status = error.response?.status;

      if (
        status === 401 &&
        original &&
        !original._retry &&
        !shouldSkipAuth(original.url) &&
        tokenStorage.getRefreshToken()
      ) {
        original._retry = true;
        const newAccess = await getRefreshingPromise();
        if (newAccess) {
          original.headers.Authorization = `Bearer ${newAccess}`;
          return client(original);
        }
      }

      return Promise.reject(error);
    },
  );
};
