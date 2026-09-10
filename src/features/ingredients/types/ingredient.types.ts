export type PagedResult<T> = {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
};

export type CatalogListQuery = {
  search?: string;
  includeInactive?: boolean;
  page: number;
  pageSize: number;
};

export type MeasurementUnitDto = {
  id: number;
  code: string;
  name: string;
  symbol?: string | null;
  allowsFractional: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  referenceCount?: number | null;
  canDelete?: boolean | null;
};

export type SaveMeasurementUnitRequest = {
  code: string;
  name: string;
  symbol?: string | null;
  allowsFractional: boolean;
  isActive: boolean;
};

export type IngredientConversionDto = {
  id: number;
  code: string;
  name: string;
  unit: MeasurementUnitDto;
  factorToBase: number;
  sortOrder: number;
  isActive: boolean;
};

export type IngredientDto = {
  id: number;
  code: string;
  name: string;
  baseUnit: MeasurementUnitDto;
  note?: string | null;
  isActive: boolean;
  conversions: IngredientConversionDto[];
  createdAt: string;
  updatedAt: string;
  productCount?: number | null;
  snapshotCount?: number | null;
  canDelete?: boolean | null;
  inventoryUnitCount?: number | null;
};

export type IngredientListItemDto = IngredientDto;

export type SaveIngredientConversionRequest = {
  id?: number;
  code: string;
  name: string;
  unitId: number;
  factorToBase: number;
  sortOrder: number;
  isActive: boolean;
};

export type SaveIngredientRequest = {
  code: string;
  name: string;
  baseUnitId: number;
  note?: string | null;
  isActive: boolean;
  conversions: SaveIngredientConversionRequest[];
};

export type IngredientListQuery = CatalogListQuery;

export type IngredientDemandOrderStatus = 1 | 2 | 3 | 4 | 99;
export type IngredientDemandSource = 1 | 2 | 3;

export type IngredientDemandPackDto = {
  conversionId: number;
  code: string;
  name: string;
  unitName: string;
  unitSymbol?: string | null;
  factorToBase: number;
  count: number;
};

export type IngredientDemandBreakdownDto = {
  totalBaseQuantity: number;
  packs: IngredientDemandPackDto[];
  baseRemainder: number;
};

export type IngredientDemandSummaryDto = {
  ingredientId?: number | null;
  ingredientCode?: string | null;
  ingredientName: string;
  baseUnitCode?: string | null;
  baseUnitName: string;
  baseUnitSymbol?: string | null;
  totalBaseQuantity: number;
  breakdown?: IngredientDemandBreakdownDto | null;
};

export type IngredientDemandLineDto = {
  ingredientId?: number | null;
  ingredientCode?: string | null;
  ingredientName: string;
  baseUnitCode?: string | null;
  baseUnitName: string;
  baseUnitSymbol?: string | null;
  perProductBaseQuantity: number;
  productQuantity: number;
  totalBaseQuantity: number;
  note?: string | null;
};

export type IngredientDemandOrderItemDto = {
  orderItemId: string;
  productId?: number | null;
  productSku?: string | null;
  productName: string;
  quantity: number;
  source: IngredientDemandSource;
  ingredients: IngredientDemandLineDto[];
};

export type IngredientDemandOrderTotalDto = {
  ingredientId?: number | null;
  ingredientCode: string;
  ingredientName: string;
  baseUnitCode: string;
  baseUnitName: string;
  baseUnitSymbol?: string | null;
  totalBaseQuantity: number;
};

export type IngredientDemandOrderDto = {
  orderId: string;
  orderCode: string;
  deliveryAt: string;
  status: IngredientDemandOrderStatus;
  usesLegacyRecipeFallback: boolean;
  items: IngredientDemandOrderItemDto[];
  totals: IngredientDemandOrderTotalDto[];
};

export type IngredientDemandReportDto = {
  period: {
    from: string;
    to: string;
    timeZone: string;
    dateBasis: string;
  };
  generatedAt: string;
  statuses: IngredientDemandOrderStatus[];
  summary: IngredientDemandSummaryDto[];
  details: PagedResult<IngredientDemandOrderDto>;
  hasLegacyRecipeFallback: boolean;
};

export type IngredientDemandQuery = {
  from: string;
  to: string;
  statuses: IngredientDemandOrderStatus[];
  page: number;
  pageSize: number;
};
