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

export interface ProductIngredientDto {
  id: number;
  ingredientId: number;
  baseQuantity: number;
  note: string | null;
  sortOrder: number;
}

export interface FeDataExportResult {
  generatedAt: string;
  productCount: number;
  imageCount: number;
  catalogVersion: string;
  warnings: string[];
}

export interface ProductCatalogSettings {
  priceDeviationPercent: number;
  updatedAt: string | null;
}

export interface ProductRecognitionResult {
  productId: number;
  sku: string;
  name: string;
  thumbnailUrl: string | null;
  similarityPercent: number;
}

export interface ProductRecognitionResponse {
  results: ProductRecognitionResult[];
  indexedProductCount: number;
  activeProductCount: number;
  minimumSimilarityPercent: number;
  embeddingVersion: string;
}

export interface ProductRecognitionIndexStatus {
  indexedProductCount: number;
  activeProductCount: number;
  pendingImageCount: number;
  embeddingVersion: string;
}

export interface ProductRecognitionBackfillResult {
  processedImageCount: number;
  failedImageCount: number;
  remainingImageCount: number;
  warnings: string[];
}

export interface CreateProductRequest {
  sku: string;
  price: number;
  salePrice: number;
  stock: number;
  tracksInventory: boolean;
  categoryId: number;
  productTypeId: number;
  thumbnailUrl: string;
  tagIds: number[];
  colorIds: number[];
  collectionIds: number[];
  styleIds: number[];
  occasionIds: number[];
  similarProductIds: number[];
  translations: ProductTranslation[];
  images: ProductImagePayload[];
}

export interface ProductDto {
  id: number;
  sku: string;
  price: number;
  salePrice: number | null;
  stock: number;
  tracksInventory: boolean;
  categoryId: number;
  productTypeId?: number | null;
  isActive: boolean;
  isVisibleOnFE: boolean;
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
  similarProductIds: number[];
  ingredients: ProductIngredientDto[];
}

export const ProductApi = {
  /** Gửi product + file ảnh (thumbnail, images). BE lưu file và tạo URL. */
  createWithFormData: async (formData: FormData): Promise<void> => {
    await apiClient.post('/api/settings/products', formData, {
      headers: {
        // Ghi đè header mặc định 'application/json' để ASP.NET Core bind [FromForm] CreateProductCommand
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  /** Cập nhật sản phẩm (multipart). BE thường dùng PUT + Id trong URL hoặc form. */
  updateWithFormData: async (id: number, formData: FormData): Promise<void> => {
    await apiClient.put(`/api/settings/products/${id}`, formData, {
      headers: {
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

  setFeVisibility: async (id: number, isVisibleOnFE: boolean): Promise<void> => {
    await apiClient.patch(`/api/settings/products/${id}/fe-visibility`, { isVisibleOnFE });
  },

  exportFeData: async (): Promise<FeDataExportResult> => {
    const { data } = await apiClient.post<FeDataExportResult>('/api/fe-data/export');
    return data;
  },

  getCatalogSettings: async (): Promise<ProductCatalogSettings> => {
    const { data } = await apiClient.get<ProductCatalogSettings>('/api/settings/products/catalog/settings');
    return data;
  },

  updateCatalogSettings: async (priceDeviationPercent: number): Promise<ProductCatalogSettings> => {
    const { data } = await apiClient.put<ProductCatalogSettings>(
      '/api/settings/products/catalog/settings',
      { priceDeviationPercent },
    );
    return data;
  },

  getRecognitionStatus: async (): Promise<ProductRecognitionIndexStatus> => {
    const { data } = await apiClient.get<ProductRecognitionIndexStatus>(
      '/api/settings/products/catalog/recognition/status',
    );
    return data;
  },

  recognizeImage: async (image: File): Promise<ProductRecognitionResponse> => {
    const formData = new FormData();
    formData.append('Image', image);
    const { data } = await apiClient.post<ProductRecognitionResponse>(
      '/api/settings/products/catalog/recognition',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return data;
  },

  backfillRecognition: async (batchSize = 40): Promise<ProductRecognitionBackfillResult> => {
    const { data } = await apiClient.post<ProductRecognitionBackfillResult>(
      '/api/settings/products/catalog/recognition/backfill',
      null,
      { params: { batchSize } },
    );
    return data;
  },
};

