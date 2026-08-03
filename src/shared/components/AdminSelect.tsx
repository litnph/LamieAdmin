import React from 'react';
import Select, {
  type ClassNamesConfig,
  type GroupBase,
  type Props as SelectProps,
} from 'react-select';

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
  /** Render menu in document.body so it is not clipped inside overflow scroll/modals. */
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

const getClassNames = <
  TValue extends string | number,
  TIsMulti extends boolean,
  TOption extends AdminSelectOption<TValue>,
>(): ClassNamesConfig<TOption, TIsMulti, GroupBase<TOption>> => ({
  control: (state) => {
    const invalid = state.selectProps['aria-invalid'] === true || state.selectProps['aria-invalid'] === 'true';
    return [
      'flex min-h-11 max-h-[6.75rem] items-stretch rounded-admin-control border bg-admin-card text-admin-text-primary transition-colors duration-150',
      invalid
        ? 'border-admin-status-error ring-2 ring-admin-status-error/10'
        : state.isFocused
          ? 'border-admin-primary/45 ring-2 ring-admin-primary/15'
          : 'border-admin-input-border hover:border-admin-primary/35',
    ].join(' ');
  },
  valueContainer: () => [
    'flex min-h-0 min-w-0 flex-1 flex-wrap content-start items-center gap-1.5 overflow-x-hidden overflow-y-auto px-3 py-1.5',
    'max-h-[5.5rem] [scrollbar-width:thin]',
  ].join(' '),
  input: () => 'min-w-[3ch] flex-1 text-sm text-admin-text-primary',
  placeholder: () => 'text-sm text-admin-text-muted',
  singleValue: () => 'truncate text-sm text-admin-text-primary',
  multiValue: () => 'max-w-[min(100%,11rem)] shrink-0 rounded-md border border-admin-primary/15 bg-admin-primary/10',
  multiValueLabel: () => 'max-w-[min(100%,10rem)] truncate px-2 py-1 text-xs text-admin-text-primary',
  multiValueRemove: () => 'min-h-7 min-w-7 shrink-0 rounded-r-md px-1 text-admin-text-muted hover:bg-admin-status-error/10 hover:text-admin-status-error',
  indicatorsContainer: () => 'flex shrink-0 items-center self-center py-1 pr-1 text-admin-text-muted',
  dropdownIndicator: () => 'inline-flex min-h-10 min-w-10 items-center justify-center text-admin-text-muted hover:text-admin-text-secondary',
  clearIndicator: () => 'inline-flex min-h-10 min-w-10 items-center justify-center text-admin-text-muted hover:text-admin-text-primary',
  menu: () => 'mt-1.5 overflow-hidden rounded-admin-control border border-admin-border bg-admin-card shadow-admin-popover',
  menuList: () => 'max-h-44 overflow-auto py-1',
  menuPortal: () => 'z-[110]',
  option: (state) => [
    'mx-1 min-h-11 cursor-pointer rounded-md px-3 py-2.5 text-sm transition-colors duration-150',
    state.isFocused ? 'bg-admin-primary/8 text-admin-primary' : '',
    state.isSelected ? 'bg-admin-primary/12 font-medium text-admin-primary' : '',
  ].join(' '),
  noOptionsMessage: () => 'px-3 py-3 text-center text-sm text-admin-text-muted',
});

export function AdminSelect<
  TValue extends string | number = number,
  TOption extends AdminSelectOption<TValue> = AdminSelectOption<TValue>,
>(props: AdminSelectSingleProps<TValue, TOption>): React.ReactElement;
export function AdminSelect<
  TValue extends string | number = number,
  TOption extends AdminSelectOption<TValue> = AdminSelectOption<TValue>,
>(props: AdminSelectMultiProps<TValue, TOption>): React.ReactElement;
export function AdminSelect<
  TValue extends string | number = number,
  TOption extends AdminSelectOption<TValue> = AdminSelectOption<TValue>,
>(
  props: AdminSelectSingleProps<TValue, TOption> | AdminSelectMultiProps<TValue, TOption>,
): React.ReactElement {
  if (props.isMulti) {
    const { value, onChange, options, placeholder, menuInPortal, ...rest } = props;
    return (
      <Select<TOption, true, GroupBase<TOption>>
        {...rest}
        isMulti
        unstyled
        options={options}
        value={value}
        placeholder={placeholder ?? 'Chọn một hoặc nhiều mục'}
        classNames={getClassNames<TValue, true, TOption>()}
        menuPosition={menuInPortal ? 'fixed' : undefined}
        menuPortalTarget={menuInPortal && typeof document !== 'undefined' ? document.body : undefined}
        menuShouldScrollIntoView={false}
        noOptionsMessage={() => 'Không có lựa chọn phù hợp'}
        onChange={(next) => onChange(next.slice())}
      />
    );
  }

  const { value, onChange, options, placeholder, menuInPortal, ...rest } =
    props as AdminSelectSingleProps<TValue, TOption>;
  return (
    <Select<TOption, false, GroupBase<TOption>>
      {...rest}
      unstyled
      options={options}
      value={value}
      placeholder={placeholder ?? 'Chọn một mục'}
      classNames={getClassNames<TValue, false, TOption>()}
      menuPosition={menuInPortal ? 'fixed' : undefined}
      menuPortalTarget={menuInPortal && typeof document !== 'undefined' ? document.body : undefined}
      menuShouldScrollIntoView={false}
      noOptionsMessage={() => 'Không có lựa chọn phù hợp'}
      onChange={(next) => onChange(next)}
    />
  );
}
