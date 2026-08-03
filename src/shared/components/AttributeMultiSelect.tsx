import React, { useMemo, useRef, useState } from 'react';
import Select, {
  components as RSComponents,
  type ClassNamesConfig,
  type ControlProps,
  type GroupBase,
  type MenuListProps,
  type MultiValueProps,
  type SelectInstance,
  type ValueContainerProps,
} from 'react-select';
import type { AttributeItem } from '@/features/settings/attributes/types/attributes.types';

export type AttributeMultiSelectProps = {
  label: string;
  inputId?: string;
  options: AttributeItem[];
  /** Controlled selected ids (order preserved) */
  selectedIds: number[];
  onChange: (next: number[]) => void;
  loading?: boolean;
  placeholder?: string;
  /** `colors` uses compact dots + hex; default uses text chips */
  variant?: 'default' | 'colors';
  /** Visible tags/dots when collapsed (not focused); default 3 */
  maxCollapsedVisible?: number;
  menuInPortal?: boolean;
};

type Option = {
  value: number;
  label: string;
  hex?: string;
};

function optionFromAttribute(item: AttributeItem, variant: 'default' | 'colors'): Option {
  const label = item.translations?.[0]?.name ?? `#${item.id}`;
  const hexCode = Reflect.get(item, 'hexCode');
  if (variant === 'colors' && typeof hexCode === 'string' && hexCode) {
    return { value: item.id, label, hex: hexCode };
  }
  return { value: item.id, label };
}

function splitValueChildren(children: React.ReactNode): { tags: React.ReactNode[]; input: React.ReactNode } {
  const arr = React.Children.toArray(children);
  if (arr.length === 0) return { tags: [], input: null };
  const input = arr[arr.length - 1];
  const tags = arr.slice(0, -1);
  return { tags, input };
}

function optionFromMultiValueChild(node: React.ReactNode): Option | null {
  if (!React.isValidElement<{ data?: Option }>(node)) return null;
  return node.props.data ?? null;
}

function OverflowSummaryTag(props: {
  count: number;
  tooltip: string;
  onActivate: () => void;
  variant: 'default' | 'colors';
}) {
  const { count, tooltip, onActivate, variant } = props;
  return (
    <button
      type="button"
      title={tooltip}
      aria-label={`${count} mục đã chọn khác: ${tooltip}`}
      className={[
        'min-h-8 shrink-0 rounded-md border border-admin-primary/20 bg-admin-primary/10 px-2 py-1 text-xs font-semibold text-admin-primary',
        'hover:bg-admin-primary/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-admin-primary/30',
        variant === 'colors' ? 'min-w-8' : 'max-w-[3.5rem]',
      ].join(' ')}
      onMouseDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onActivate();
      }}
    >
      +{count}
    </button>
  );
}

function CompactMultiValue(props: MultiValueProps<Option, true, GroupBase<Option>>) {
  const { data, innerProps, selectProps, getValue } = props;
  const remove = () => {
    const selected = getValue();
    selectProps.onChange(selected.filter((option) => option.value !== data.value), {
      action: 'remove-value',
      removedValue: data,
    });
  };
  return (
    <div
      {...innerProps}
      className="group flex max-w-[min(100%,7.5rem)] shrink-0 items-center gap-0.5 rounded-md border border-admin-primary/15 bg-admin-primary/8 pl-2 pr-0.5 py-0.5"
    >
      <span className="min-w-0 flex-1 truncate text-xs text-admin-text-primary" title={data.label}>
        {data.label}
      </span>
      <button
        type="button"
        aria-label={`Bỏ chọn ${data.label}`}
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          remove();
        }}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-admin-text-muted transition-colors hover:bg-admin-status-error/10 hover:text-admin-status-error focus:outline-none"
      >
        <span className="text-sm leading-none" aria-hidden>
          ×
        </span>
      </button>
    </div>
  );
}

function ColorDotMultiValue(props: MultiValueProps<Option, true, GroupBase<Option>>) {
  const { data, innerProps, selectProps, getValue } = props;
  const fill = data.hex?.trim() || '#94a3b8';
  const remove = () => {
    const selected = getValue();
    selectProps.onChange(selected.filter((option) => option.value !== data.value), {
      action: 'remove-value',
      removedValue: data,
    });
  };
  return (
    <div {...innerProps} className="inline-flex shrink-0">
      <button
        type="button"
        title={data.label}
        aria-label={`Bỏ chọn màu ${data.label}`}
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          remove();
        }}
        className="relative h-8 w-8 shrink-0 rounded-admin-control border border-admin-border transition-colors hover:border-admin-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-admin-primary/40"
        style={{ backgroundColor: fill }}
      />
    </div>
  );
}

function SelectedInMenuPanel(props: {
  options: Option[];
  onRemove: (opt: Option) => void;
  variant: 'default' | 'colors';
}) {
  const { options, onRemove, variant } = props;
  if (options.length === 0) return null;
  return (
    <div className="border-b border-admin-border/50 px-2 py-2">
      <p className="mb-1.5 px-1 text-xs font-semibold text-admin-text-muted">Đã chọn</p>
      <div className="flex max-h-28 flex-wrap gap-1.5 overflow-y-auto [scrollbar-width:thin]">
        {options.map((opt) =>
          variant === 'colors' ? (
            <button
              key={opt.value}
              type="button"
              title={opt.label}
              aria-label={`Bỏ chọn ${opt.label}`}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onRemove(opt)}
              className="h-10 w-10 shrink-0 rounded-admin-control border border-admin-border transition-opacity hover:opacity-80"
              style={{ backgroundColor: opt.hex?.trim() || '#94a3b8' }}
            />
          ) : (
            <button
              key={opt.value}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onRemove(opt)}
              aria-label={`Bỏ chọn ${opt.label}`}
              className="inline-flex min-h-10 max-w-[10rem] items-center gap-1 rounded-md border border-admin-primary/15 bg-admin-primary/8 px-2 py-1 text-left text-xs text-admin-text-primary hover:bg-admin-primary/12"
            >
              <span className="truncate">{opt.label}</span>
              <span className="shrink-0 text-admin-text-muted" aria-hidden>
                ×
              </span>
            </button>
          ),
        )}
      </div>
    </div>
  );
}

function buildMenuListWithSelected(variant: 'default' | 'colors') {
  return function MenuListWithSelected(props: MenuListProps<Option, true, GroupBase<Option>>) {
    const { children, selectProps, getValue } = props;
    const selected = getValue();

    const remove = (opt: Option) => {
      const next = selected.filter((o) => o.value !== opt.value);
      selectProps.onChange(next, {
        action: 'remove-value',
        removedValue: opt,
      });
    };

    return (
      <RSComponents.MenuList {...props}>
        <SelectedInMenuPanel options={[...selected]} onRemove={remove} variant={variant} />
        {children}
      </RSComponents.MenuList>
    );
  };
}

function buildValueContainer(
  selectRef: React.RefObject<SelectInstance<Option, true, GroupBase<Option>> | null>,
  maxCollapsedVisible: number,
  isControlFocused: boolean,
  variant: 'default' | 'colors',
) {
  return function ValueContainer(props: ValueContainerProps<Option, true, GroupBase<Option>>) {
    const { children } = props;
    const max = maxCollapsedVisible;
    const expanded = isControlFocused || !!props.selectProps.menuIsOpen;

    const { tags, input } = splitValueChildren(children);
    const overflow = tags.length - max;
    const showAll = expanded || tags.length <= max;

    if (showAll) {
      return <RSComponents.ValueContainer {...props}>{children}</RSComponents.ValueContainer>;
    }

    const visible = tags.slice(0, max);
    const hiddenNodes = tags.slice(max);
    const hiddenOptions = hiddenNodes
      .map(optionFromMultiValueChild)
      .filter((option): option is Option => option !== null);
    const tooltip = hiddenOptions.map((o) => o.label).join(', ');

    return (
      <RSComponents.ValueContainer {...props}>
        {visible}
        <OverflowSummaryTag
          count={overflow}
          tooltip={tooltip}
          variant={variant}
          onActivate={() => {
            selectRef.current?.focus();
            selectRef.current?.openMenu('first');
          }}
        />
        {input}
      </RSComponents.ValueContainer>
    );
  };
}

const getClassNamesBase = (isControlFocused: boolean): ClassNamesConfig<Option, true, GroupBase<Option>> => ({
  control: (state: ControlProps<Option, true, GroupBase<Option>>) => {
    const expanded = state.isFocused || !!state.selectProps.menuIsOpen;
    return [
      'flex rounded-admin-control border bg-admin-card text-admin-text-primary transition-[min-height,max-height,box-shadow,border-color,background-color] duration-150 ease-out',
      expanded
        ? 'min-h-11 max-h-[6.75rem] items-stretch border-admin-primary/40 ring-2 ring-admin-primary/10'
        : 'min-h-11 max-h-11 items-center border-admin-input-border hover:border-admin-primary/30',
    ].join(' ');
  },
  valueContainer: (state: ValueContainerProps<Option, true, GroupBase<Option>>) => {
    const expanded = isControlFocused || !!state.selectProps.menuIsOpen;
    return [
      'flex min-h-0 min-w-0 flex-1 items-center gap-1.5 px-3 py-1 transition-[max-height] duration-200 ease-out',
      expanded
        ? 'max-h-[5.5rem] flex-wrap content-start overflow-y-auto overflow-x-hidden py-1.5 [scrollbar-width:thin]'
        : 'max-h-[2.25rem] flex-nowrap overflow-hidden',
    ].join(' ');
  },
  input: () => 'min-w-[3ch] flex-1 text-sm text-admin-text-primary',
  placeholder: () => 'truncate text-sm text-admin-text-secondary',
  multiValue: () => 'shrink-0',
  multiValueLabel: () => '',
  multiValueRemove: () => '',
  indicatorsContainer: () => 'flex shrink-0 items-center self-center py-1 pr-1 text-admin-text-muted',
  dropdownIndicator: () => 'text-admin-text-muted hover:text-admin-text-secondary px-2',
  clearIndicator: () => 'text-admin-text-muted hover:text-admin-text-primary px-2',
  menu: () => 'mt-1.5 overflow-hidden rounded-admin-control border border-admin-border bg-admin-card shadow-admin-popover',
  menuList: () => 'max-h-52 overflow-auto py-1',
  menuPortal: () => 'z-[110]',
  option: (s) =>
    [
      'mx-1 min-h-11 cursor-pointer rounded-md px-3 py-2.5 text-sm transition-colors duration-150',
      s.isFocused ? 'bg-admin-primary/8 text-admin-primary' : '',
      s.isSelected ? 'bg-admin-primary/12 text-admin-primary font-medium' : '',
    ].join(' '),
  noOptionsMessage: () => 'px-3 py-3 text-sm text-admin-text-muted text-center',
});

export const AttributeMultiSelect: React.FC<AttributeMultiSelectProps> = ({
  label,
  inputId,
  options: attributeOptions,
  selectedIds,
  onChange,
  loading,
  placeholder,
  variant = 'default',
  maxCollapsedVisible = 3,
  menuInPortal = true,
}) => {
  const selectRef = useRef<SelectInstance<Option, true, GroupBase<Option>>>(null);
  const [isControlFocused, setIsControlFocused] = useState(false);

  const selectOptions: Option[] = useMemo(
    () => attributeOptions.map((o) => optionFromAttribute(o, variant)),
    [attributeOptions, variant],
  );

  const value: Option[] = useMemo(() => {
    const map = new Map(selectOptions.map((o) => [o.value, o] as const));
    return selectedIds
      .map((id) => map.get(id))
      .filter((option): option is Option => option !== undefined);
  }, [selectOptions, selectedIds]);

  const ValueContainer = useMemo(
    () => buildValueContainer(selectRef, maxCollapsedVisible, isControlFocused, variant),
    [maxCollapsedVisible, isControlFocused, variant],
  );
  const MenuList = useMemo(() => buildMenuListWithSelected(variant), [variant]);

  const components = useMemo(
    () => ({
      MultiValue: variant === 'colors' ? ColorDotMultiValue : CompactMultiValue,
      ValueContainer,
      MenuList,
    }),
    [variant, ValueContainer, MenuList],
  );

  const uid = React.useId().replace(/:/g, '');
  const resolvedInputId = inputId ?? `attr-multi-input-${uid}`;

  return (
    <div className="min-h-0 space-y-1.5">
      <label htmlFor={resolvedInputId} className="block text-xs font-medium text-admin-text-secondary">{label}</label>
      <Select<Option, true, GroupBase<Option>>
        ref={selectRef}
        instanceId={`attr-multi-${uid}`}
        inputId={resolvedInputId}
        isMulti
        unstyled
        classNames={getClassNamesBase(isControlFocused)}
        menuPosition={menuInPortal ? 'fixed' : undefined}
        menuPortalTarget={menuInPortal && typeof document !== 'undefined' ? document.body : undefined}
        menuShouldScrollIntoView={false}
        closeMenuOnSelect={false}
        blurInputOnSelect={false}
        hideSelectedOptions={false}
        isDisabled={!!loading}
        isLoading={!!loading}
        options={selectOptions}
        value={value}
        placeholder={loading ? 'Đang tải...' : placeholder ?? 'Chọn thuộc tính'}
        noOptionsMessage={() => 'Không có lựa chọn phù hợp'}
        onChange={(next) => onChange((next ?? []).map((o) => o.value))}
        onFocus={() => setIsControlFocused(true)}
        onBlur={() => setIsControlFocused(false)}
        filterOption={(candidate, raw) => {
          const q = raw.toLowerCase();
          if (!q) return true;
          return candidate.label.toLowerCase().includes(q);
        }}
        components={components}
      />
    </div>
  );
};
