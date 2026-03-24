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
import type { AttributeItem, AttributeItemColor } from '@/features/settings/attributes/types/attributes.types';

export type AttributeMultiSelectProps = {
  label: string;
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

/** Subcomponents receive `selectProps` = full Select props; we read these custom top-level fields */
function customSelectProps(sp: unknown): {
  maxCollapsedVisible: number;
  isControlFocused: boolean;
  variant: 'default' | 'colors';
} {
  const o = sp as {
    maxCollapsedVisible?: number;
    isControlFocused?: boolean;
    variant?: 'default' | 'colors';
  };
  return {
    maxCollapsedVisible: o.maxCollapsedVisible ?? 3,
    isControlFocused: !!o.isControlFocused,
    variant: o.variant ?? 'default',
  };
}

function optionFromAttribute(item: AttributeItem, variant: 'default' | 'colors'): Option {
  const label = item.translations?.[0]?.name ?? `#${item.id}`;
  if (variant === 'colors' && 'hexCode' in item && (item as AttributeItemColor).hexCode) {
    return { value: item.id, label, hex: (item as AttributeItemColor).hexCode };
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
  if (!React.isValidElement(node)) return null;
  const p = node.props as { data?: Option };
  return p.data ?? null;
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
      aria-label={`${count} more selected: ${tooltip}`}
      className={[
        'shrink-0 rounded-lg border border-admin-primary/20 bg-admin-primary/10 px-2 py-0.5 text-xs font-semibold text-admin-primary',
        'hover:bg-admin-primary/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-admin-primary/30',
        variant === 'colors' ? 'h-7 min-w-[1.75rem]' : 'max-w-[3.5rem]',
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
  const { data, innerProps, removeProps } = props;
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
        aria-label={`Remove ${data.label}`}
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          removeProps.onMouseDown?.(e as React.MouseEvent<HTMLDivElement>);
        }}
        onClick={(e) => removeProps.onClick?.(e as React.MouseEvent<HTMLDivElement>)}
        className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-admin-text-muted opacity-0 transition-opacity hover:bg-admin-status-error/10 hover:text-admin-status-error group-hover:opacity-100 focus:opacity-100 focus:outline-none"
      >
        <span className="text-sm leading-none" aria-hidden>
          ×
        </span>
      </button>
    </div>
  );
}

function ColorDotMultiValue(props: MultiValueProps<Option, true, GroupBase<Option>>) {
  const { data, innerProps, removeProps } = props;
  const fill = data.hex?.trim() || '#94a3b8';
  return (
    <div {...innerProps} className="inline-flex shrink-0">
      <button
        type="button"
        title={data.label}
        aria-label={`Remove color ${data.label}`}
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          removeProps.onMouseDown?.(e as React.MouseEvent<HTMLDivElement>);
        }}
        onClick={(e) => removeProps.onClick?.(e as React.MouseEvent<HTMLDivElement>)}
        className="relative h-7 w-7 shrink-0 rounded-full border border-admin-border/80 shadow-sm transition-transform hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-admin-primary/40"
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
      <p className="mb-1.5 px-1 text-[0.65rem] font-semibold uppercase tracking-wide text-admin-text-muted">Selected</p>
      <div className="flex max-h-28 flex-wrap gap-1.5 overflow-y-auto [scrollbar-width:thin]">
        {options.map((opt) =>
          variant === 'colors' ? (
            <button
              key={opt.value}
              type="button"
              title={opt.label}
              aria-label={`Remove ${opt.label}`}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onRemove(opt)}
              className="h-7 w-7 shrink-0 rounded-full border border-admin-border/80 shadow-sm transition-opacity hover:opacity-80"
              style={{ backgroundColor: opt.hex?.trim() || '#94a3b8' }}
            />
          ) : (
            <button
              key={opt.value}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onRemove(opt)}
              className="inline-flex max-w-[10rem] items-center gap-1 rounded-md border border-admin-primary/15 bg-admin-primary/8 px-2 py-1 text-left text-xs text-admin-text-primary hover:bg-admin-primary/12"
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

function MenuListWithSelected(props: MenuListProps<Option, true, GroupBase<Option>>) {
  const { children, selectProps } = props;
  const { variant } = customSelectProps(selectProps);
  const selected = (selectProps.value as Option[] | undefined) ?? [];

  const remove = (opt: Option) => {
    const next = selected.filter((o) => o.value !== opt.value);
    selectProps.onChange(next as unknown as Option[], {
      action: 'remove-value',
      removedValue: opt,
    } as any);
  };

  return (
    <RSComponents.MenuList {...props}>
      <SelectedInMenuPanel options={selected} onRemove={remove} variant={variant} />
      {children}
    </RSComponents.MenuList>
  );
}

function buildValueContainer(
  selectRef: React.RefObject<SelectInstance<Option, true, GroupBase<Option>> | null>,
) {
  return function ValueContainer(props: ValueContainerProps<Option, true, GroupBase<Option>>) {
    const { children } = props;
    const c = customSelectProps(props.selectProps);
    const max = c.maxCollapsedVisible ?? 3;
    const expanded = !!c.isControlFocused || !!props.selectProps.menuIsOpen;
    const variant = c.variant ?? 'default';

    const { tags, input } = splitValueChildren(children);
    const overflow = tags.length - max;
    const showAll = expanded || tags.length <= max;

    if (showAll) {
      return <RSComponents.ValueContainer {...props}>{children}</RSComponents.ValueContainer>;
    }

    const visible = tags.slice(0, max);
    const hiddenNodes = tags.slice(max);
    const hiddenOptions = hiddenNodes.map(optionFromMultiValueChild).filter(Boolean) as Option[];
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

const classNamesBase: ClassNamesConfig<Option, true, GroupBase<Option>> = {
  control: (state: ControlProps<Option, true, GroupBase<Option>>) => {
    const expanded = state.isFocused || !!state.selectProps.menuIsOpen;
    return [
      'flex rounded-xl border bg-white/60 backdrop-blur-sm text-admin-text-primary transition-[min-height,max-height,box-shadow,border-color,background-color] duration-200 ease-out',
      expanded
        ? 'min-h-[2.5rem] max-h-[6.75rem] items-stretch border-admin-primary/40 ring-2 ring-admin-primary/10 bg-white/80'
        : 'min-h-[2.5rem] max-h-[2.5rem] items-center border-admin-input-border hover:border-admin-primary/30',
    ].join(' ');
  },
  valueContainer: (state: ValueContainerProps<Option, true, GroupBase<Option>>) => {
    const c = customSelectProps(state.selectProps);
    const expanded = !!c.isControlFocused || !!state.selectProps.menuIsOpen;
    return [
      'flex min-h-0 min-w-0 flex-1 items-center gap-1.5 px-3 py-1 transition-[max-height] duration-200 ease-out',
      expanded
        ? 'max-h-[5.5rem] flex-wrap content-start overflow-y-auto overflow-x-hidden py-1.5 [scrollbar-width:thin]'
        : 'max-h-[2.25rem] flex-nowrap overflow-hidden',
    ].join(' ');
  },
  input: () => 'min-w-[3ch] flex-1 text-sm text-admin-text-primary',
  placeholder: () => 'truncate text-sm text-admin-text-muted',
  multiValue: () => 'shrink-0',
  multiValueLabel: () => '',
  multiValueRemove: () => '',
  indicatorsContainer: () => 'flex shrink-0 items-center self-center py-1 pr-1 text-admin-text-muted',
  dropdownIndicator: () => 'text-admin-text-muted hover:text-admin-text-secondary px-2',
  clearIndicator: () => 'text-admin-text-muted hover:text-admin-text-primary px-2',
  menu: () => 'mt-1.5 rounded-xl border border-admin-border/60 bg-white/90 backdrop-blur-xl shadow-lg shadow-black/8 overflow-hidden animate-slide-down',
  menuList: () => 'max-h-52 overflow-auto py-1',
  option: (s) =>
    [
      'px-3 py-2 text-sm cursor-pointer transition-colors duration-150 mx-1 rounded-lg',
      s.isFocused ? 'bg-admin-primary/8 text-admin-primary' : '',
      s.isSelected ? 'bg-admin-primary/12 text-admin-primary font-medium' : '',
    ].join(' '),
  noOptionsMessage: () => 'px-3 py-3 text-sm text-admin-text-muted text-center',
};

export const AttributeMultiSelect: React.FC<AttributeMultiSelectProps> = ({
  label,
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
    return selectedIds.map((id) => map.get(id)).filter(Boolean) as Option[];
  }, [selectOptions, selectedIds]);

  const ValueContainer = useMemo(() => buildValueContainer(selectRef), []);

  const components = useMemo(
    () => ({
      MultiValue: variant === 'colors' ? ColorDotMultiValue : CompactMultiValue,
      ValueContainer,
      MenuList: MenuListWithSelected,
    }),
    [variant, ValueContainer],
  );

  const portalStyles = menuInPortal
    ? { menuPortal: (base: Record<string, unknown>) => ({ ...base, zIndex: 10050 }) }
    : undefined;

  const uid = React.useId().replace(/:/g, '');

  return (
    <div className="min-h-0 space-y-1.5">
      <label className="block text-xs font-medium text-admin-text-secondary">{label}</label>
      <Select<Option, true, GroupBase<Option>>
        ref={selectRef}
        instanceId={`attr-multi-${uid}`}
        isMulti
        unstyled
        classNames={classNamesBase}
        styles={portalStyles as any}
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
        placeholder={loading ? 'Loading...' : placeholder ?? 'Select'}
        onChange={(next) => onChange((next ?? []).map((o) => o.value))}
        onFocus={() => setIsControlFocused(true)}
        onBlur={() => setIsControlFocused(false)}
        filterOption={(candidate, raw) => {
          const q = raw.toLowerCase();
          if (!q) return true;
          return candidate.label.toLowerCase().includes(q);
        }}
        components={components}
        {...({
          maxCollapsedVisible,
          isControlFocused,
          variant,
        } as Record<string, unknown>)}
      />
    </div>
  );
};
