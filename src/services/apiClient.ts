import axios from 'axios';

export const apiClient = axios.create({
  baseURL: 'https://d477-115-78-226-70.ngrok-free.app',
  headers: {
    'Content-Type': 'application/json',
  },
});

