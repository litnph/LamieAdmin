import type { PagedResult } from '@/features/ingredients/types/ingredient.types';

export const CONTENT_PLATFORMS = ['facebook', 'instagram', 'tiktok'] as const;
export type ContentPlatform = typeof CONTENT_PLATFORMS[number];
export type ContentSourceType = 'product' | 'uploaded-images';

export type ContentProductOptionDto = {
  id: number;
  sku: string;
  name: string;
  price: number;
  salePrice?: number | null;
  thumbnailUrl?: string | null;
};

export type ContentStyleDto = { id: string; name: string };

export type ContentProviderStatusDto = {
  isConfigured: boolean;
  providerName: string;
  model: string;
  message?: string | null;
  styles: ContentStyleDto[];
};

export type ContentFooterSettingDto = {
  id?: string | null;
  platform: ContentPlatform;
  content: string;
  hashtags: string[];
  isEnabled: boolean;
  updatedAt?: string | null;
};

export type SaveContentFooterSettingRequest = {
  content: string;
  hashtags: string[];
  isEnabled: boolean;
};

export type GeneratedContentItemDto = {
  id?: string;
  platform: ContentPlatform;
  body: string;
  footerSnapshot: string;
  hashtagsSnapshot: string[];
  completeContent: string;
};

export type GenerateContentResponseDto = {
  generationToken: string;
  sourceType: ContentSourceType;
  productId?: number | null;
  productNameSnapshot?: string | null;
  imageUrlSnapshot?: string | null;
  uploadedImageUrls: string[];
  styleId: string;
  styleName: string;
  seed: string;
  provider: string;
  model: string;
  promptVersion: string;
  items: GeneratedContentItemDto[];
  warnings: string[];
  createdAt: string;
  savedAt?: string | null;
};

export type SaveGeneratedContentRequest = {
  generationToken: string;
  items: Array<Pick<GeneratedContentItemDto, 'platform' | 'body'>>;
};

export type ContentGenerationSummaryDto = {
  id: string;
  sourceType: ContentSourceType;
  productId?: number | null;
  productNameSnapshot?: string | null;
  platforms: ContentPlatform[];
  styleName: string;
  status: 'draft' | 'saved';
  createdAt: string;
  savedAt?: string | null;
  parentGenerationId?: string | null;
};

export type ContentGenerationDetailDto = ContentGenerationSummaryDto & {
  imageUrlSnapshot?: string | null;
  brief?: string | null;
  uploadedImageUrls: string[];
  items: GeneratedContentItemDto[];
  provider?: string | null;
  model?: string | null;
  promptVersion?: string | null;
};

export type ContentHistoryQuery = {
  from?: string;
  to?: string;
  productId?: number;
  platform?: ContentPlatform;
  page: number;
  pageSize: number;
};

export type ContentHistoryResult = PagedResult<ContentGenerationSummaryDto>;

export type CreateContentVersionRequest = {
  items: Array<Pick<GeneratedContentItemDto, 'platform' | 'body'>>;
};
