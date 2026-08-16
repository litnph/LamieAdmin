import type { AdministrativeScheme } from './order.types';

export type AdministrativeAddressValue = {
  scheme: AdministrativeScheme;
  provinceCode: string;
  provinceName: string;
  districtCode: string;
  districtName: string;
  communeCode: string;
  communeName: string;
  detail: string;
};

export type AdministrativeAddressField = 'detail' | 'province' | 'district' | 'commune';

export type AdministrativeUnitDto = {
  code: string;
  name: string;
  fullName: string;
  scheme: AdministrativeScheme;
  unitType: number;
  hierarchyLevel: number;
  parentCode?: string | null;
  isActive: boolean;
  sortOrder: number;
};

export type AdministrativeTransitionDto = {
  legacyUnitCode: string;
  currentUnitCode: string;
  transitionType: number;
  currentUnitName: string;
  currentProvinceName?: string | null;
  sourceDocument: string;
  sourceReference: string;
  note?: string | null;
  isSuggestionOnly: boolean;
};

export type AddressResolutionSuggestionDto = {
  scheme: AdministrativeScheme;
  provinceCode?: string | null;
  provinceName?: string | null;
  districtCode?: string | null;
  districtName?: string | null;
  communeCode?: string | null;
  communeName?: string | null;
  addressDetail?: string | null;
  fullAddress: string;
  confidence: number;
  reason: string;
  usedDefaultProvince: boolean;
};

export type AddressResolutionDto = {
  originalText: string;
  normalizedText: string;
  isConfident: boolean;
  confidence: number;
  selectedCandidate?: AddressResolutionSuggestionDto | null;
  candidates: AddressResolutionSuggestionDto[];
  warnings: string[];
};
