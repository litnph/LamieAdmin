import { apiClient } from '@/services/apiClient';

export interface ProductTranslation {
  languageCode: string;
  name: string;
  slug: string;
  description: string;
}

export interface ProductImagePayload {
  id: number;
  imageUrl: string;
  sortOrder: number;
  content: string;
  fileName: string;
  contentType: string;
}

export interface CreateProductRequest {
  sku: string;
  price: number;
  salePrice: number;
  stock: number;
  categoryId: number;
  thumbnailUrl: string;
  tagIds: number[];
  colorIds: number[];
  collectionIds: number[];
  styleIds: number[];
  occasionIds: number[];
  translations: ProductTranslation[];
  images: ProductImagePayload[];
}

export interface ProductDto {
  id: number;
  sku: string;
  price: number;
  salePrice: number | null;
  stock: number;
  categoryId: number;
  isActive: boolean;
  thumbnailUrl: string | null;
  translations: Array<{
    id: number;
    languageCode: string;
    name: string;
    slug: string;
    description: string | null;
  }>;
  images: Array<{
    id: number;
    imageUrl: string;
    isActive: boolean;
    sortOrder: number;
  }>;
  tagIds: number[];
  colorIds: number[];
  collectionIds: number[];
  styleIds: number[];
  occasionIds: number[];
}

export const ProductApi = {
  create: async (payload: CreateProductRequest): Promise<void> => {
    await apiClient.post('/api/settings/products', payload);
  },

  /** Gửi product + file ảnh (thumbnail, images). BE lưu file và tạo URL. */
  createWithFormData: async (formData: FormData): Promise<void> => {
    await apiClient.post('/api/settings/products', formData, {
      headers: {
        // Ghi đè header mặc định 'application/json' để ASP.NET Core bind [FromForm] CreateProductCommand
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  getAll: async (): Promise<ProductDto[]> => {
    const { data } = await apiClient.get<ProductDto[]>('/api/settings/products');
    return data;
  },

  getById: async (id: number): Promise<ProductDto> => {
    const { data } = await apiClient.get<ProductDto>(`/api/settings/products/${id}`);
    return data;
  },

  remove: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/settings/products/${id}`);
  },
};

