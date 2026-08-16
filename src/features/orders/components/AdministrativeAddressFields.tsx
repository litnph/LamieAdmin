import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, LoaderCircle } from 'lucide-react';
import { AdminSelect, type AdminSelectOption } from '@/shared/components/AdminSelect';
import { getApiErrorMessage } from '@/shared/utils/apiError';
import { administrativeAddressApi } from '../api/administrativeAddressApi';
import type {
  AdministrativeAddressField,
  AdministrativeAddressValue,
  AdministrativeTransitionDto,
  AdministrativeUnitDto,
} from '../types/administrativeAddress.types';
import { AdministrativeScheme } from '../types/order.types';

export type { AdministrativeAddressValue } from '../types/administrativeAddress.types';

type UnitOption = AdminSelectOption<string> & { unit: AdministrativeUnitDto };

type Props = {
  value: AdministrativeAddressValue;
  onChange: (value: AdministrativeAddressValue) => void;
  disabled?: boolean;
  idPrefix?: string;
  invalidField?: AdministrativeAddressField;
  errorId?: string;
};

const inputClass =
  'min-h-11 w-full rounded-admin-control border border-admin-input-border bg-admin-card px-3 py-2 text-sm text-admin-text-primary placeholder:text-admin-text-muted transition-colors focus:border-admin-primary focus:outline-none focus:ring-2 focus:ring-admin-primary/15 disabled:cursor-not-allowed disabled:bg-admin-disabled-bg disabled:text-admin-disabled-text';
const labelClass = 'mb-1 block min-h-4 text-xs font-medium leading-4 text-admin-text-secondary';

const emptyBelowProvince = (value: AdministrativeAddressValue): AdministrativeAddressValue => ({
  ...value,
  districtCode: '',
  districtName: '',
  communeCode: '',
  communeName: '',
});

const option = (unit: AdministrativeUnitDto): UnitOption => ({
  value: unit.code,
  label: unit.fullName,
  unit,
});

const selectedOption = (
  code: string,
  name: string,
  units: AdministrativeUnitDto[],
  scheme: AdministrativeScheme,
  level: number,
): UnitOption | null => {
  if (!code) return null;
  const unit = units.find((item) => item.code === code) ?? {
    code,
    name,
    fullName: name || code,
    scheme,
    unitType: 0,
    hierarchyLevel: level,
    isActive: true,
    sortOrder: 0,
  };
  return option(unit);
};

export const AdministrativeAddressFields: React.FC<Props> = ({
  value,
  onChange,
  disabled = false,
  idPrefix = 'address',
  invalidField,
  errorId,
}) => {
  const [provinces, setProvinces] = useState<AdministrativeUnitDto[]>([]);
  const [districts, setDistricts] = useState<AdministrativeUnitDto[]>([]);
  const [communes, setCommunes] = useState<AdministrativeUnitDto[]>([]);
  const [transitions, setTransitions] = useState<AdministrativeTransitionDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const districtRequest = useRef(0);
  const communeRequest = useRef(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    void administrativeAddressApi.provinces(value.scheme)
      .then((items) => { if (active) setProvinces(items); })
      .catch((requestError) => { if (active) setError(getApiErrorMessage(requestError)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [value.scheme]);

  useEffect(() => {
    if (!value.provinceCode || value.scheme !== AdministrativeScheme.Legacy) {
      setDistricts([]);
      return;
    }
    const requestId = ++districtRequest.current;
    void administrativeAddressApi.children(value.provinceCode, value.scheme)
      .then((items) => { if (requestId === districtRequest.current) setDistricts(items); })
      .catch((requestError) => { if (requestId === districtRequest.current) setError(getApiErrorMessage(requestError)); });
  }, [value.provinceCode, value.scheme]);

  useEffect(() => {
    const parentCode = value.scheme === AdministrativeScheme.Current ? value.provinceCode : value.districtCode;
    if (!parentCode) {
      setCommunes([]);
      return;
    }
    const requestId = ++communeRequest.current;
    void administrativeAddressApi.children(parentCode, value.scheme)
      .then((items) => { if (requestId === communeRequest.current) setCommunes(items); })
      .catch((requestError) => { if (requestId === communeRequest.current) setError(getApiErrorMessage(requestError)); });
  }, [value.districtCode, value.provinceCode, value.scheme]);

  useEffect(() => {
    if (value.scheme !== AdministrativeScheme.Legacy || !value.communeCode) {
      setTransitions([]);
      return;
    }
    let active = true;
    void administrativeAddressApi.transitions(value.communeCode)
      .then((items) => { if (active) setTransitions(items); })
      .catch(() => { if (active) setTransitions([]); });
    return () => { active = false; };
  }, [value.communeCode, value.scheme]);

  const provinceOptions = useMemo(() => provinces.map(option), [provinces]);
  const districtOptions = useMemo(() => districts.map(option), [districts]);
  const communeOptions = useMemo(() => communes.map(option), [communes]);

  const searchChildren = (
    kind: 'district' | 'commune',
    input: string,
  ) => {
    const targetRef = kind === 'district' ? districtRequest : communeRequest;
    const requestId = ++targetRef.current;
    const parentCode = kind === 'district'
      ? value.provinceCode
      : value.scheme === AdministrativeScheme.Current ? value.provinceCode : value.districtCode;
    if (!parentCode || (input.trim().length > 0 && input.trim().length < 2)) return;
    window.setTimeout(() => {
      if (requestId !== targetRef.current) return;
      void administrativeAddressApi.children(parentCode, value.scheme, input)
        .then((items) => {
          if (requestId !== targetRef.current) return;
          if (kind === 'district') setDistricts(items);
          else setCommunes(items);
        })
        .catch(() => undefined);
    }, 250);
  };

  return (
    <div className="space-y-3">
      <fieldset>
        <legend className={labelClass}>Loại địa chỉ</legend>
        <div className="grid grid-cols-2 gap-1 rounded-admin-control border border-admin-border bg-admin-muted p-1">
          {([
            [AdministrativeScheme.Current, 'Địa chỉ mới'],
            [AdministrativeScheme.Legacy, 'Địa chỉ cũ'],
          ] as const).map(([scheme, label]) => (
            <button
              key={scheme}
              type="button"
              role="radio"
              aria-checked={value.scheme === scheme}
              disabled={disabled}
              onClick={() => onChange({
                ...emptyBelowProvince(value),
                scheme,
                provinceCode: '',
                provinceName: '',
              })}
              className={`min-h-10 rounded-admin-control px-3 text-xs font-semibold transition-colors ${value.scheme === scheme ? 'bg-admin-card text-admin-primary shadow-sm' : 'text-admin-text-secondary hover:text-admin-text-primary'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor={`${idPrefix}-detail`} className={labelClass}>Địa chỉ chi tiết</label>
        <input
          id={`${idPrefix}-detail`}
          className={`${inputClass} ${invalidField === 'detail' ? 'border-admin-status-error ring-2 ring-admin-status-error/10' : ''}`}
          disabled={disabled}
          aria-invalid={invalidField === 'detail'}
          aria-describedby={invalidField === 'detail' ? errorId : undefined}
          value={value.detail}
          onChange={(event) => onChange({ ...value, detail: event.target.value })}
          placeholder="Số nhà, tên đường, tòa nhà..."
          autoComplete="shipping street-address"
        />
      </div>

      <div>
        <label htmlFor={`${idPrefix}-province`} className={labelClass}>Tỉnh / Thành phố</label>
        <AdminSelect<string, UnitOption>
          inputId={`${idPrefix}-province`}
          aria-invalid={invalidField === 'province'}
          aria-describedby={invalidField === 'province' ? errorId : undefined}
          isDisabled={disabled || loading}
          isLoading={loading}
          isClearable
          options={provinceOptions}
          value={selectedOption(value.provinceCode, value.provinceName, provinces, value.scheme, 1)}
          onChange={(next) => onChange({
            ...emptyBelowProvince(value),
            provinceCode: next?.unit.code ?? '',
            provinceName: next?.unit.fullName ?? '',
          })}
          placeholder="Tìm và chọn tỉnh / thành phố"
        />
      </div>

      {value.scheme === AdministrativeScheme.Legacy ? (
        <div>
          <label htmlFor={`${idPrefix}-district`} className={labelClass}>Quận / Huyện / Thị xã / Thành phố</label>
          <AdminSelect<string, UnitOption>
            inputId={`${idPrefix}-district`}
            aria-invalid={invalidField === 'district'}
            aria-describedby={invalidField === 'district' ? errorId : undefined}
            isDisabled={disabled || !value.provinceCode}
            isClearable
            options={districtOptions}
            value={selectedOption(value.districtCode, value.districtName, districts, value.scheme, 2)}
            onInputChange={(input, action) => { if (action.action === 'input-change') searchChildren('district', input); }}
            onChange={(next) => onChange({
              ...value,
              districtCode: next?.unit.code ?? '',
              districtName: next?.unit.fullName ?? '',
              communeCode: '',
              communeName: '',
            })}
            placeholder={value.provinceCode ? 'Tìm và chọn đơn vị cấp huyện' : 'Chọn tỉnh / thành phố trước'}
          />
        </div>
      ) : null}

      <div>
        <label htmlFor={`${idPrefix}-commune`} className={labelClass}>
          {value.scheme === AdministrativeScheme.Current ? 'Xã / Phường / Đặc khu' : 'Xã / Phường / Thị trấn'}
        </label>
        <AdminSelect<string, UnitOption>
          inputId={`${idPrefix}-commune`}
          aria-invalid={invalidField === 'commune'}
          aria-describedby={invalidField === 'commune' ? errorId : undefined}
          isDisabled={disabled || !value.provinceCode || (value.scheme === AdministrativeScheme.Legacy && !value.districtCode)}
          isClearable
          options={communeOptions}
          value={selectedOption(value.communeCode, value.communeName, communes, value.scheme, value.scheme === AdministrativeScheme.Current ? 2 : 3)}
          onInputChange={(input, action) => { if (action.action === 'input-change') searchChildren('commune', input); }}
          onChange={(next) => onChange({
            ...value,
            communeCode: next?.unit.code ?? '',
            communeName: next?.unit.fullName ?? '',
          })}
          placeholder="Nhập ít nhất 2 ký tự để tìm nhanh"
        />
        <p className="mt-1 text-[11px] leading-4 text-admin-text-muted">Có thể tìm không dấu, ví dụ “an nhon”.</p>
      </div>

      {transitions.length > 0 ? (
        <div className="rounded-admin-control border border-admin-status-warning/30 bg-amber-50/70 px-3 py-2.5 text-xs leading-5 text-admin-text-secondary">
          <div className="flex items-start gap-2">
            <AlertTriangle size={14} className="mt-0.5 shrink-0 text-admin-status-warning" aria-hidden="true" />
            <div>
              <p className="font-semibold text-admin-text-primary">Gợi ý địa chỉ hành chính mới</p>
              {transitions.map((transition) => (
                <p key={`${transition.legacyUnitCode}-${transition.currentUnitCode}`}>
                  {transition.currentUnitName}{transition.currentProvinceName ? `, ${transition.currentProvinceName}` : ''}
                  {transition.isSuggestionOnly ? ' — ranh giới chưa đủ chắc chắn, không tự chuyển đổi.' : ''}
                </p>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {error ? <p className="text-xs leading-5 text-admin-status-error" role="status">{error}</p> : null}
      {loading ? <span className="sr-only"><LoaderCircle className="animate-spin" />Đang tải dữ liệu địa chỉ</span> : null}
    </div>
  );
};
