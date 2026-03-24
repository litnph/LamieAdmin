import React from 'react';
import Select, { type ClassNamesConfig, type GroupBase, type MultiValue, type Props as SelectProps, type SingleValue } from 'react-select';

export type AdminSelectOption<TValue extends string | number = number> = {
  value: TValue;
  label: string;
  isDisabled?: boolean;
};

type BaseProps<
  TValue extends string | number,
  TIsMulti extends boolean,
  TOption extends AdminSelectOption<TValue>,
> = Omit<SelectProps<TOption, TIsMulti, GroupBase<TOption>>, 'isMulti' | 'value' | 'onChange' | 'options'> & {
  options: TOption[];
  placeholder?: string;
  isMulti?: TIsMulti;
  /** Render menu in document.body so it is not clipped inside overflow scroll/modals */
  menuInPortal?: boolean;
};

export type AdminSelectSingleProps<
  TValue extends string | number = number,
  TOption extends AdminSelectOption<TValue> = AdminSelectOption<TValue>,
> = BaseProps<TValue, false, TOption> & {
  isMulti?: false;
  value: TOption | null;
  onChange: (next: TOption | null) => void;
};

export type AdminSelectMultiProps<
  TValue extends string | number = number,
  TOption extends AdminSelectOption<TValue> = AdminSelectOption<TValue>,
> = BaseProps<TValue, true, TOption> & {
  isMulti: true;
  value: TOption[];
  onChange: (next: TOption[]) => void;
};

const classNames: ClassNamesConfig<AdminSelectOption<any>, boolean> = {
  control: (state) =>
    [
      'flex min-h-[2.5rem] max-h-[6.75rem] items-stretch rounded-xl border bg-white/60 backdrop-blur-sm text-admin-text-primary transition-all duration-200',
      state.isFocused
        ? 'border-admin-primary/40 ring-2 ring-admin-primary/10 bg-white/80'
        : 'border-admin-input-border hover:border-admin-primary/30',
    ].join(' '),
  valueContainer: () =>
    [
      'flex min-h-0 min-w-0 flex-1 flex-wrap content-start items-center gap-1.5 overflow-y-auto overflow-x-hidden px-3 py-1.5',
      'max-h-[5.5rem]',
      '[scrollbar-width:thin]',
    ].join(' '),
  input: () => 'min-w-[3ch] flex-1 text-sm text-admin-text-primary',
  placeholder: () => 'text-sm text-admin-text-muted',
  singleValue: () => 'truncate text-sm text-admin-text-primary',
  multiValue: () => 'max-w-[min(100%,11rem)] shrink-0 bg-admin-primary/8 border border-admin-primary/15 rounded-lg',
  multiValueLabel: () => 'max-w-[min(100%,10rem)] truncate px-2 py-1 text-xs text-admin-text-primary',
  multiValueRemove: () => 'shrink-0 text-admin-text-muted hover:text-admin-status-error rounded-r-lg px-1',
  indicatorsContainer: () => 'flex shrink-0 items-center self-center py-1 pr-1 text-admin-text-muted',
  dropdownIndicator: () => 'text-admin-text-muted hover:text-admin-text-secondary px-2',
  clearIndicator: () => 'text-admin-text-muted hover:text-admin-text-primary px-2',
  menu: () => 'mt-1.5 rounded-xl border border-admin-border/60 bg-white/90 backdrop-blur-xl shadow-lg shadow-black/8 overflow-hidden animate-slide-down',
  menuList: () => 'max-h-44 overflow-auto py-1',
  option: (state) =>
    [
      'px-3 py-2 text-sm cursor-pointer transition-colors duration-150 mx-1 rounded-lg',
      state.isFocused ? 'bg-admin-primary/8 text-admin-primary' : '',
      state.isSelected ? 'bg-admin-primary/12 text-admin-primary font-medium' : '',
    ].join(' '),
  noOptionsMessage: () => 'px-3 py-3 text-sm text-admin-text-muted text-center',
};

export function AdminSelect<
  TValue extends string | number = number,
  TOption extends AdminSelectOption<TValue> = AdminSelectOption<TValue>,
>(props: AdminSelectSingleProps<TValue, TOption> | AdminSelectMultiProps<TValue, TOption>) {
  const { isMulti, placeholder, options, menuInPortal, ...rest } = props as any;

  const portalStyles = menuInPortal
    ? { menuPortal: (base: Record<string, unknown>) => ({ ...base, zIndex: 10050 }) }
    : undefined;

  return (
    <Select<TOption, any>
      isMulti={!!isMulti}
      options={options}
      placeholder={placeholder ?? 'Select'}
      classNames={classNames as any}
      unstyled
      menuPosition={menuInPortal ? 'fixed' : undefined}
      menuPortalTarget={menuInPortal && typeof document !== 'undefined' ? document.body : undefined}
      styles={portalStyles}
      menuShouldScrollIntoView={false}
      {...rest}
      onChange={(next: SingleValue<TOption> | MultiValue<TOption>) => {
        if (isMulti) {
          (props as AdminSelectMultiProps<TValue, TOption>).onChange((next as MultiValue<TOption>).slice());
        } else {
          (props as AdminSelectSingleProps<TValue, TOption>).onChange((next as SingleValue<TOption>) ?? null);
        }
      }}
    />
  );
}
