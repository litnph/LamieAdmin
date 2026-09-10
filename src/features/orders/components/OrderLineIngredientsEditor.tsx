import { Leaf, Plus, Trash2 } from 'lucide-react';
import type { IngredientDto } from '@/features/ingredients/types/ingredient.types';

export type OrderLineIngredientDraft = {
  key: string;
  ingredientId: number;
  baseQuantity: number;
  note: string;
  sortOrder: number;
};

export type OrderLineIngredientOrigin = 'default' | 'order' | 'custom' | 'empty';

type Props = {
  lineIndex: number;
  productQuantity: number;
  ingredients: OrderLineIngredientDraft[];
  catalog: IngredientDto[];
  origin: OrderLineIngredientOrigin;
  onChange: (ingredients: OrderLineIngredientDraft[]) => void;
};

const inputClass = 'min-h-10 w-full rounded-admin-control border border-admin-input-border bg-admin-card px-2.5 py-2 text-sm text-admin-text-primary focus:border-admin-primary focus:outline-none focus:ring-2 focus:ring-admin-primary/15';

const unitLabel = (ingredient: IngredientDto | undefined) =>
  ingredient?.baseUnit.symbol?.trim() || ingredient?.baseUnit.name || '';

const originMessage: Record<OrderLineIngredientOrigin, string> = {
  default: 'Đã sao chép từ cấu hình mặc định. Thay đổi chỉ áp dụng cho dòng đơn này.',
  order: 'Bản chụp nguyên liệu đã lưu cùng dòng đơn. Cấu hình sản phẩm không bị thay đổi.',
  custom: 'Danh sách đã được tùy chỉnh riêng cho dòng đơn này.',
  empty: 'Sản phẩm chưa có nguyên liệu mặc định. Bạn vẫn có thể thêm thủ công.',
};

export const OrderLineIngredientsEditor = ({
  lineIndex,
  productQuantity,
  ingredients,
  catalog,
  origin,
  onChange,
}: Props) => {
  const addIngredient = () => {
    const used = new Set(ingredients.map((item) => item.ingredientId));
    const available = catalog.find((item) => item.isActive && !used.has(item.id));
    onChange([
      ...ingredients,
      {
        key: typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${ingredients.length}`,
        ingredientId: available?.id ?? 0,
        baseQuantity: 1,
        note: '',
        sortOrder: ingredients.length,
      },
    ]);
  };

  const updateIngredient = (index: number, patch: Partial<OrderLineIngredientDraft>) => {
    onChange(ingredients.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item));
  };

  const removeIngredient = (index: number) => {
    onChange(ingredients
      .filter((_, itemIndex) => itemIndex !== index)
      .map((item, sortOrder) => ({ ...item, sortOrder })));
  };

  return (
    <section className="mt-3 border-t border-admin-border pt-3" aria-labelledby={`order-line-ingredients-title-${lineIndex}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 id={`order-line-ingredients-title-${lineIndex}`} className="flex items-center gap-1.5 text-xs font-semibold text-admin-text-primary">
            <Leaf size={15} className="text-admin-primary" aria-hidden="true" />
            Nguyên liệu cần chuẩn bị
            <span className="font-normal tabular-nums text-admin-text-muted">({ingredients.length})</span>
          </h3>
          <p className="mt-1 text-xs leading-5 text-admin-text-muted">{originMessage[origin]}</p>
        </div>
        <button type="button" onClick={addIngredient} className="inline-flex min-h-9 items-center gap-1.5 rounded-admin-control px-2.5 text-xs font-semibold text-admin-primary transition-colors hover:bg-admin-primary/10">
          <Plus size={14} aria-hidden="true" /> Thêm nguyên liệu
        </button>
      </div>

      {ingredients.length === 0 ? (
        <div className="mt-2 rounded-admin-control border border-dashed border-admin-border bg-admin-card px-3 py-4 text-center text-xs text-admin-text-muted">
          Chưa có nguyên liệu cho dòng sản phẩm này.
        </div>
      ) : (
        <div className="mt-2 space-y-2">
          {ingredients.map((item, index) => {
            const selected = catalog.find((ingredient) => ingredient.id === item.ingredientId);
            const usedByOtherRows = new Set(ingredients.filter((_, itemIndex) => itemIndex !== index).map((ingredient) => ingredient.ingredientId));
            const total = Number.isFinite(item.baseQuantity) ? item.baseQuantity * Math.max(0, productQuantity) : 0;
            return (
              <div key={item.key} className="grid min-w-0 grid-cols-[minmax(0,1fr)_5.75rem_2.75rem] gap-2 rounded-admin-control border border-admin-border bg-admin-card p-2 lg:grid-cols-[minmax(0,1.25fr)_7.5rem_minmax(0,1fr)_7rem_2.75rem]">
                <div className="col-span-3 min-w-0 lg:col-span-1">
                  <label htmlFor={`order-line-ingredient-${lineIndex}-${index}`} className="sr-only">Nguyên liệu</label>
                  <select
                    id={`order-line-ingredient-${lineIndex}-${index}`}
                    className={inputClass}
                    value={item.ingredientId || ''}
                    onChange={(event) => updateIngredient(index, { ingredientId: Number(event.target.value) })}
                  >
                    <option value="">Chọn nguyên liệu</option>
                    {catalog
                      .filter((ingredient) => !usedByOtherRows.has(ingredient.id) && (ingredient.isActive || ingredient.id === item.ingredientId))
                      .map((ingredient) => (
                        <option key={ingredient.id} value={ingredient.id}>{ingredient.code} · {ingredient.name}</option>
                      ))}
                  </select>
                </div>
                <div className="relative min-w-0">
                  <label htmlFor={`order-line-ingredient-quantity-${lineIndex}-${index}`} className="sr-only">Số lượng cho một sản phẩm</label>
                  <input
                    id={`order-line-ingredient-quantity-${lineIndex}-${index}`}
                    type="number"
                    min="0.0001"
                    step="any"
                    className={`${inputClass} pr-8 text-right tabular-nums`}
                    value={Number.isFinite(item.baseQuantity) ? item.baseQuantity : ''}
                    onChange={(event) => updateIngredient(index, { baseQuantity: Number(event.target.value) })}
                  />
                  <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-[11px] text-admin-text-muted">{unitLabel(selected)}</span>
                </div>
                <div className="col-span-2 min-w-0 lg:col-span-1">
                  <label htmlFor={`order-line-ingredient-note-${lineIndex}-${index}`} className="sr-only">Ghi chú nguyên liệu</label>
                  <input
                    id={`order-line-ingredient-note-${lineIndex}-${index}`}
                    className={inputClass}
                    value={item.note}
                    onChange={(event) => updateIngredient(index, { note: event.target.value })}
                    placeholder="Ghi chú (không bắt buộc)"
                  />
                </div>
                <div className="hidden min-h-10 items-center justify-end text-right text-xs text-admin-text-secondary lg:flex">
                  Tổng <strong className="ml-1 tabular-nums text-admin-text-primary">{total.toLocaleString('vi-VN')} {unitLabel(selected)}</strong>
                </div>
                <button type="button" onClick={() => removeIngredient(index)} className="inline-flex h-10 w-10 items-center justify-center rounded-admin-control text-admin-status-error transition-colors hover:bg-admin-status-error/10" aria-label={`Xóa nguyên liệu ${index + 1}`}>
                  <Trash2 size={15} aria-hidden="true" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
