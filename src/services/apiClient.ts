import axios from 'axios';

export const apiClient = axios.create({
  baseURL: (import.meta as any).env?.VITE_API_BASE_URL ?? 'https://lamieapi.onrender.com',
  headers: {
    'Content-Type': 'application/json',
  },
});

