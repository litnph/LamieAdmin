export type AttributeName =
  | 'categories'
  | 'collections'
  | 'colors'
  | 'languages'
  | 'occasions'
  | 'product-types'
  | 'styles'
  | 'tags';

export interface LanguageAttributeItem {
  code: string;
  name: string;
  isActive: boolean;
}

export interface AttributeTranslation {
  languageCode: string;
  name: string;
  description?: string | null;
}

export interface AttributeItemBase {
  id: number;
  code?: string;
  isActive: boolean;
  sortOrder?: number;
  translations: AttributeTranslation[];
}

export interface AttributeItem extends AttributeItemBase {}

export interface AttributeItemColor extends AttributeItemBase {
  hexCode: string;
  rgbCode: string;
}

export type CreateAttributeRequest<TExtra = {}> = Omit<AttributeItemBase, 'id'> & TExtra;
export type UpdateAttributeRequest<TExtra = {}> = AttributeItemBase & TExtra;

