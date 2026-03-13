import type { AxiosInstance } from 'axios';

export const attachInterceptors = (client: AxiosInstance) => {
  client.interceptors.request.use((config) => {
    return config;
  });

  client.interceptors.response.use(
    (response) => response,
    (error) => {
      return Promise.reject(error);
    },
  );
};

