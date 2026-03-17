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
      'min-h-[40px] rounded-lg border bg-admin-bg text-admin-text-primary',
      state.isFocused ? 'border-admin-input-focus ring-2 ring-admin-input-focus/20' : 'border-admin-input-border',
      'hover:border-admin-input-focus',
    ].join(' '),
  valueContainer: () => 'px-2 py-1 gap-1',
  input: () => 'text-sm text-admin-text-primary',
  placeholder: () => 'text-sm text-admin-text-secondary',
  singleValue: () => 'text-sm text-admin-text-primary',
  multiValue: () => 'bg-admin-muted border border-admin-border rounded-lg',
  multiValueLabel: () => 'text-xs text-admin-text-primary px-2 py-1',
  multiValueRemove: () => 'text-admin-text-secondary hover:text-admin-status-error px-1',
  indicatorsContainer: () => 'text-admin-text-secondary',
  dropdownIndicator: () => 'text-admin-text-secondary hover:text-admin-text-primary',
  clearIndicator: () => 'text-admin-text-secondary hover:text-admin-text-primary',
  menu: () => 'mt-1 rounded-xl border border-admin-input-border bg-admin-card shadow-lg overflow-hidden',
  menuList: () => 'max-h-44 overflow-auto',
  option: (state) =>
    ['px-3 py-2 text-xs cursor-pointer', state.isFocused ? 'bg-admin-muted' : '', state.isSelected ? 'bg-admin-muted/80' : ''].join(
      ' ',
    ),
  noOptionsMessage: () => 'px-3 py-2 text-xs text-admin-text-secondary',
};

export function AdminSelect<
  TValue extends string | number = number,
  TOption extends AdminSelectOption<TValue> = AdminSelectOption<TValue>,
>(props: AdminSelectSingleProps<TValue, TOption> | AdminSelectMultiProps<TValue, TOption>) {
  const { isMulti, placeholder, options, ...rest } = props as any;

  return (
    <Select<TOption, any>
      isMulti={!!isMulti}
      options={options}
      placeholder={placeholder ?? 'Select'}
      classNames={classNames as any}
      unstyled
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

