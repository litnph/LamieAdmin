export interface Language {
  code: string;
  name: string;
  isActive: boolean;
}

export interface CreateLanguageRequest {
  code: string;
  name: string;
  isActive?: boolean;
}

export interface UpdateLanguageRequest {
  name: string;
  isActive?: boolean;
}

export interface TagTranslation {
  languageCode: string;
  name: string;
  description?: string | null;
}

export interface Tag {
  id: number;
  isActive: boolean;
  translations: TagTranslation[];
}

export interface CreateTagRequest {
  isActive?: boolean;
  translations: TagTranslation[];
}

export interface UpdateTagRequest {
  isActive?: boolean;
  translations: TagTranslation[];
}

// Placeholder types to keep color/category pages compiling.
export interface Color {
  id: string;
  hex_code: string;
  rgb_code?: string | null;
  is_active: boolean;
}

export interface Category {
  id: string;
  sort_order?: number | null;
  is_active: boolean;
}

