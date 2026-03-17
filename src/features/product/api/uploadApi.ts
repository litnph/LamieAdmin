import { apiClient } from '@/services/apiClient';

export const UploadApi = {
  uploadImage: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);

    const { data } = await apiClient.post('/api/settings/uploads/images', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (typeof data === 'string') return data;
    if (data && typeof (data as any).url === 'string') return (data as any).url;
    if (data && typeof (data as any).imageUrl === 'string') return (data as any).imageUrl;
    return '';
  },
};

