import { apiClient } from '@/services/apiClient';
import type {
  ContentFooterSettingDto,
  ContentGenerationDetailDto,
  ContentGenerationSummaryDto,
  ContentHistoryQuery,
  ContentHistoryResult,
  ContentPlatform,
  ContentProductOptionDto,
  ContentProviderStatusDto,
  ContentSourceType,
  CreateContentVersionRequest,
  GenerateContentResponseDto,
  GeneratedContentItemDto,
  SaveContentFooterSettingRequest,
  SaveGeneratedContentRequest,
} from '../types/content.types';

type PlatformEnum = 1 | 2 | 3;
type SourceTypeEnum = 1 | 2;
type StatusEnum = 1 | 2 | 99;

type RawContentItem = {
  id: string;
  platform: PlatformEnum;
  body: string;
  footerSnapshot?: string | null;
  hashtagsSnapshot?: string | null;
  fullContent: string;
};

type RawContentGeneration = {
  id: string;
  sourceType: SourceTypeEnum;
  productId?: number | null;
  productNameSnapshot?: string | null;
  productImageUrlSnapshot?: string | null;
  brief?: string | null;
  styleId: string;
  styleName: string;
  styleSeed: number;
  status: StatusEnum;
  provider: string;
  model: string;
  promptVersion: string;
  parentGenerationId?: string | null;
  createdAt: string;
  updatedAt: string;
  savedAt?: string | null;
  items: RawContentItem[];
  assets: Array<{ id: string; url: string; fileName: string; contentType: string; sortOrder: number }>;
};

type RawHistoryItem = {
  id: string;
  sourceType: SourceTypeEnum;
  productId?: number | null;
  productNameSnapshot?: string | null;
  styleName: string;
  status: StatusEnum;
  platforms: PlatformEnum[];
  createdAt: string;
  savedAt?: string | null;
  parentGenerationId?: string | null;
};

const platformToEnum: Record<ContentPlatform, PlatformEnum> = { facebook: 1, instagram: 2, tiktok: 3 };
const enumPlatformMap: Record<PlatformEnum, ContentPlatform> = { 1: 'facebook', 2: 'instagram', 3: 'tiktok' };
const enumToPlatform = (value: PlatformEnum): ContentPlatform => enumPlatformMap[value];
const sourceType = (value: SourceTypeEnum): ContentSourceType => value === 1 ? 'product' : 'uploaded-images';
const splitHashtags = (value?: string | null) => value?.split(/\s+/).map((item) => item.trim()).filter(Boolean) ?? [];

const mapItem = (item: RawContentItem): GeneratedContentItemDto => ({
  id: item.id,
  platform: enumToPlatform(item.platform),
  body: item.body,
  footerSnapshot: item.footerSnapshot ?? '',
  hashtagsSnapshot: splitHashtags(item.hashtagsSnapshot),
  completeContent: item.fullContent,
});

const mapGeneration = (item: RawContentGeneration): GenerateContentResponseDto => ({
  generationToken: item.id,
  sourceType: sourceType(item.sourceType),
  productId: item.productId,
  productNameSnapshot: item.productNameSnapshot,
  imageUrlSnapshot: item.productImageUrlSnapshot,
  uploadedImageUrls: item.assets.sort((left, right) => left.sortOrder - right.sortOrder).map((asset) => asset.url),
  styleId: item.styleId,
  styleName: item.styleName,
  seed: String(item.styleSeed),
  provider: item.provider,
  model: item.model,
  promptVersion: item.promptVersion,
  items: item.items.map(mapItem),
  warnings: [],
  createdAt: item.createdAt,
  savedAt: item.savedAt,
});

const mapSummary = (item: RawHistoryItem): ContentGenerationSummaryDto => ({
  id: item.id,
  sourceType: sourceType(item.sourceType),
  productId: item.productId,
  productNameSnapshot: item.productNameSnapshot,
  platforms: item.platforms.map(enumToPlatform),
  styleName: item.styleName,
  status: item.status === 2 ? 'saved' : 'draft',
  createdAt: item.createdAt,
  savedAt: item.savedAt,
  parentGenerationId: item.parentGenerationId,
});

const toDetail = (item: RawContentGeneration): ContentGenerationDetailDto => ({
  id: item.id,
  sourceType: sourceType(item.sourceType),
  productId: item.productId,
  productNameSnapshot: item.productNameSnapshot,
  platforms: item.items.map((entry) => enumToPlatform(entry.platform)),
  styleName: item.styleName,
  status: item.status === 2 ? 'saved' : 'draft',
  createdAt: item.createdAt,
  savedAt: item.savedAt,
  parentGenerationId: item.parentGenerationId,
  imageUrlSnapshot: item.productImageUrlSnapshot,
  brief: item.brief,
  uploadedImageUrls: item.assets.sort((left, right) => left.sortOrder - right.sortOrder).map((asset) => asset.url),
  items: item.items.map(mapItem),
  provider: item.provider,
  model: item.model,
  promptVersion: item.promptVersion,
});

export type GenerateContentInput = {
  sourceType: ContentSourceType;
  productId?: number;
  topic?: string;
  notes?: string;
  tone?: string;
  language: string;
  customInstructions?: string;
  images: File[];
  idempotencyKey: string;
};

const buildBrief = (input: GenerateContentInput) => [
  input.topic ? `Chủ đề/dịp tặng: ${input.topic}` : '',
  input.notes ? `Dữ kiện và ghi chú: ${input.notes}` : '',
  input.tone ? `Giọng văn mong muốn: ${input.tone}` : '',
  `Ngôn ngữ: ${input.language}`,
  input.customInstructions ? `Hướng dẫn riêng: ${input.customInstructions}` : '',
].filter(Boolean).join('\n');

export const contentApi = {
  status: async (): Promise<ContentProviderStatusDto> => {
    const { data } = await apiClient.get<{ isAiConfigured: boolean; model: string; styles: Array<{ id: string; name: string }> }>('/api/content/configuration');
    return {
      isConfigured: data.isAiConfigured,
      providerName: 'OpenAI',
      model: data.model,
      styles: data.styles,
      message: data.isAiConfigured ? null : 'AI chưa được cấu hình trên API. Hãy cấu hình khóa OpenAI ở máy chủ.',
    };
  },

  products: async (): Promise<ContentProductOptionDto[]> => {
    const { data } = await apiClient.get<Array<{
      id: number;
      sku: string;
      price: number;
      salePrice?: number | null;
      isActive: boolean;
      thumbnailUrl?: string | null;
      translations: Array<{ languageCode: string; name: string }>;
    }>>('/api/settings/products');
    return data.filter((item) => item.isActive).map((item) => ({
      id: item.id,
      sku: item.sku,
      name: item.translations.find((translation) => translation.languageCode === 'vi')?.name
        ?? item.translations[0]?.name
        ?? item.sku,
      price: item.price,
      salePrice: item.salePrice,
      thumbnailUrl: item.thumbnailUrl,
    }));
  },

  generate: async (input: GenerateContentInput, signal?: AbortSignal): Promise<GenerateContentResponseDto> => {
    const form = new FormData();
    if (input.sourceType === 'product' && input.productId) form.append('productId', String(input.productId));
    const brief = buildBrief(input);
    if (brief) form.append('brief', brief);
    input.images.forEach((image) => form.append('images', image));
    const { data } = await apiClient.post<RawContentGeneration>('/api/content/generate', form, {
      signal,
      timeout: 90_000,
      headers: { 'Idempotency-Key': input.idempotencyKey },
    });
    return mapGeneration(data);
  },

  save: async (payload: SaveGeneratedContentRequest): Promise<ContentGenerationDetailDto> => {
    const { data } = await apiClient.put<RawContentGeneration>(`/api/content/generations/${payload.generationToken}/save`, {
      items: payload.items.map((item) => ({ platform: platformToEnum[item.platform], body: item.body })),
    });
    return toDetail(data);
  },

  footerSettings: async (): Promise<ContentFooterSettingDto[]> => {
    const { data } = await apiClient.get<Array<{
      id?: string | null;
      platform: PlatformEnum;
      content?: string | null;
      hashtags?: string | null;
      isActive: boolean;
      updatedAt?: string | null;
    }>>('/api/content/footers');
    return data.map((item) => ({
      id: item.id,
      platform: enumToPlatform(item.platform),
      content: item.content ?? '',
      hashtags: splitHashtags(item.hashtags),
      isEnabled: item.isActive,
      updatedAt: item.updatedAt,
    }));
  },

  saveFooterSetting: async (
    platform: ContentPlatform,
    payload: SaveContentFooterSettingRequest,
  ): Promise<ContentFooterSettingDto> => {
    const { data } = await apiClient.put<{
      id?: string | null;
      platform: PlatformEnum;
      content?: string | null;
      hashtags?: string | null;
      isActive: boolean;
      updatedAt?: string | null;
    }>(`/api/content/footers/${platformToEnum[platform]}`, {
      content: payload.content || null,
      hashtags: payload.hashtags.join(' ') || null,
      isActive: payload.isEnabled,
    });
    return {
      id: data.id,
      platform: enumToPlatform(data.platform),
      content: data.content ?? '',
      hashtags: splitHashtags(data.hashtags),
      isEnabled: data.isActive,
      updatedAt: data.updatedAt,
    };
  },

  history: async (query: ContentHistoryQuery): Promise<ContentHistoryResult> => {
    const { data } = await apiClient.get<{
      items: RawHistoryItem[];
      totalCount: number;
      page: number;
      pageSize: number;
      totalPages: number;
      hasNext: boolean;
      hasPrevious: boolean;
    }>('/api/content/history', {
      params: {
        from: query.from,
        to: query.to,
        productId: query.productId,
        platform: query.platform ? platformToEnum[query.platform] : undefined,
        status: 2,
        page: query.page,
        pageSize: query.pageSize,
      },
    });
    return { ...data, items: data.items.map(mapSummary) };
  },

  historyDetail: async (id: string): Promise<ContentGenerationDetailDto> => {
    const { data } = await apiClient.get<RawContentGeneration>(`/api/content/generations/${id}`);
    return toDetail(data);
  },

  createVersion: async (
    id: string,
    payload: CreateContentVersionRequest,
  ): Promise<ContentGenerationDetailDto> => {
    const { data } = await apiClient.put<RawContentGeneration>(`/api/content/generations/${id}/save`, {
      items: payload.items.map((item) => ({ platform: platformToEnum[item.platform], body: item.body })),
    });
    return toDetail(data);
  },
};
