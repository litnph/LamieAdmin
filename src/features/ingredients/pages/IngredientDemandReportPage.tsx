import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  FileSearch,
  RefreshCw,
} from "@/shared/icons/lucideAnimated";
import { getApiErrorMessage } from "@/shared/utils/apiError";
import { ingredientDemandApi } from "../api/ingredientsApi";
import {
  formatDecimalQuantity,
  IngredientShell,
  IngredientStatus,
} from "../components/IngredientShell";
import type {
  IngredientDemandOrderStatus,
  IngredientDemandQuery,
  IngredientDemandReportDto,
  IngredientDemandSummaryDto,
} from "../types/ingredient.types";

const TIME_ZONE = "Asia/Ho_Chi_Minh";
const PAGE_SIZE = 20;
const inputClass =
  "h-11 w-full rounded-admin-control border border-admin-input-border bg-admin-card px-3 text-sm text-admin-text-primary outline-none transition-colors focus:border-admin-primary focus:ring-2 focus:ring-admin-primary/15";
const statusOptions: Array<{
  value: IngredientDemandOrderStatus;
  label: string;
}> = [
  { value: 1, label: "Chờ xác nhận" },
  { value: 2, label: "Đang chuẩn bị" },
  { value: 3, label: "Đang giao" },
  { value: 4, label: "Hoàn tất" },
];

const dateInTimeZone = (date: Date) => {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const value = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );
  return `${value.year}-${value.month}-${value.day}`;
};

const initialDates = () => {
  const to = dateInTimeZone(new Date());
  return { from: `${to.slice(0, 7)}-01`, to };
};

const formatDateTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: TIME_ZONE,
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
};

const quantityWithUnit = (value: string | number, unit?: string | null) =>
  `${formatDecimalQuantity(value)}${unit ? ` ${unit}` : ""}`;

const SummaryCard: React.FC<{ item: IngredientDemandSummaryDto }> = ({
  item,
}) => (
  <article className="rounded-admin-panel border border-admin-border bg-admin-surface p-4 shadow-admin-panel sm:p-5">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <h3 className="font-semibold text-admin-text-primary">
          {item.ingredientName}
        </h3>
        {item.ingredientCode ? (
          <p className="mt-0.5 font-mono text-xs text-admin-text-muted">
            {item.ingredientCode}
          </p>
        ) : (
          <p className="mt-0.5 text-xs text-amber-700">
            Nguyên liệu lịch sử không còn trong danh mục
          </p>
        )}
      </div>
      <div className="text-right">
        <p className="text-xl font-semibold tabular-nums text-admin-primary">
          {quantityWithUnit(
            item.totalBaseQuantity,
            item.baseUnitSymbol || item.baseUnitName,
          )}
        </p>
        <p className="mt-0.5 text-xs text-admin-text-muted">Tổng đơn vị gốc</p>
      </div>
    </div>
    {item.breakdown?.packs.length ? (
      <dl className="mt-4 space-y-2 border-t border-admin-border pt-4">
        {item.breakdown.packs.map((part) => (
          <div
            key={part.conversionId}
            className="flex items-center justify-between gap-3 text-sm"
          >
            <dt className="text-admin-text-secondary">
              {part.name}{" "}
              <span className="text-xs text-admin-text-muted">
                × {formatDecimalQuantity(part.factorToBase)}
              </span>
            </dt>
            <dd className="font-semibold tabular-nums text-admin-text-primary">
              {quantityWithUnit(part.count, part.unitSymbol || part.unitName)}
            </dd>
          </div>
        ))}
        <div className="flex items-center justify-between gap-3 border-t border-admin-border pt-2 text-sm">
          <dt className="text-admin-text-secondary">Phần lẻ theo đơn vị gốc</dt>
          <dd className="font-semibold tabular-nums text-admin-text-primary">
            {quantityWithUnit(
              item.breakdown.baseRemainder,
              item.baseUnitSymbol || item.baseUnitName,
            )}
          </dd>
        </div>
      </dl>
    ) : (
      <p className="mt-4 border-t border-admin-border pt-4 text-xs leading-5 text-admin-text-muted">
        Chưa có quy cách phù hợp; dùng toàn bộ số lượng theo đơn vị gốc.
      </p>
    )}
  </article>
);

export const IngredientDemandReportPage: React.FC<{ embedded?: boolean }> = ({
  embedded = false,
}) => {
  const dates = useMemo(initialDates, []);
  const [from, setFrom] = useState(dates.from);
  const [to, setTo] = useState(dates.to);
  const [statuses, setStatuses] = useState<IngredientDemandOrderStatus[]>([
    1, 2,
  ]);
  const [applied, setApplied] = useState({
    from: dates.from,
    to: dates.to,
    statuses: [1, 2] as IngredientDemandOrderStatus[],
  });
  const [page, setPage] = useState(1);
  const [report, setReport] = useState<IngredientDemandReportDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [validationError, setValidationError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const query: IngredientDemandQuery = {
      ...applied,
      page,
      pageSize: PAGE_SIZE,
    };
    try {
      setReport(await ingredientDemandApi.get(query));
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, [applied, page]);

  useEffect(() => {
    void load();
  }, [load]);

  const toggleStatus = (status: IngredientDemandOrderStatus) => {
    setStatuses((current) =>
      current.includes(status)
        ? current.filter((item) => item !== status)
        : [...current, status],
    );
  };

  const applyFilters = (event: React.FormEvent) => {
    event.preventDefault();
    if (!from || !to) {
      setValidationError("Chọn đầy đủ ngày bắt đầu và kết thúc.");
      return;
    }
    if (from > to) {
      setValidationError("Ngày bắt đầu không được sau ngày kết thúc.");
      return;
    }
    if (!statuses.length) {
      setValidationError("Chọn ít nhất một trạng thái đơn hàng.");
      return;
    }
    setValidationError("");
    setPage(1);
    setApplied({
      from,
      to,
      statuses: [...statuses].sort((left, right) => left - right),
    });
  };

  const fallbackOrderCount =
    report?.details.items.filter((order) => order.usesLegacyRecipeFallback)
      .length ?? 0;

  const content = (
    <>
      <div className="space-y-5">
        <form
          onSubmit={applyFilters}
          className="rounded-admin-panel border border-admin-border bg-admin-surface p-4 shadow-admin-panel sm:p-5"
        >
          <div className="grid gap-4 md:grid-cols-[minmax(10rem,.7fr)_minmax(10rem,.7fr)_minmax(20rem,2fr)_auto] md:items-end">
            <div>
              <label
                htmlFor="demand-from"
                className="mb-1.5 block text-sm font-medium text-admin-text-primary"
              >
                Từ ngày giao
              </label>
              <input
                id="demand-from"
                type="date"
                value={from}
                onChange={(event) => setFrom(event.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label
                htmlFor="demand-to"
                className="mb-1.5 block text-sm font-medium text-admin-text-primary"
              >
                Đến ngày giao
              </label>
              <input
                id="demand-to"
                type="date"
                value={to}
                onChange={(event) => setTo(event.target.value)}
                className={inputClass}
              />
            </div>
            <fieldset>
              <legend className="mb-1.5 text-sm font-medium text-admin-text-primary">
                Trạng thái đơn hàng
              </legend>
              <div className="flex min-h-11 flex-wrap items-center gap-x-4 gap-y-2 rounded-admin-control border border-admin-border px-3 py-2">
                {statusOptions.map((option) => (
                  <label
                    key={option.value}
                    className="flex cursor-pointer items-center gap-2 text-sm text-admin-text-secondary"
                  >
                    <input
                      type="checkbox"
                      checked={statuses.includes(option.value)}
                      onChange={() => toggleStatus(option.value)}
                      className="h-4 w-4 accent-admin-primary"
                    />{" "}
                    {option.label}
                  </label>
                ))}
              </div>
            </fieldset>
            <button
              type="submit"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-admin-control bg-admin-primary px-5 text-sm font-semibold text-admin-primary-foreground hover:bg-admin-primary-hover"
            >
              <FileSearch size={17} aria-hidden="true" /> Xem báo cáo
            </button>
          </div>
          {validationError ? (
            <p className="mt-3 text-sm text-admin-status-error" role="alert">
              {validationError}
            </p>
          ) : null}
        </form>

        {error ? (
          <IngredientStatus kind="error">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span>{error}</span>
              <button
                type="button"
                onClick={() => void load()}
                className="inline-flex min-h-9 items-center gap-1.5 font-semibold underline underline-offset-2"
              >
                <RefreshCw size={15} aria-hidden="true" /> Thử lại
              </button>
            </div>
          </IngredientStatus>
        ) : null}
        {report?.hasLegacyRecipeFallback ? (
          <IngredientStatus kind="warning">
            <span className="inline-flex items-start gap-2">
              <AlertTriangle
                size={17}
                className="mt-1 shrink-0"
                aria-hidden="true"
              />
              <span>
                {fallbackOrderCount > 0
                  ? `${fallbackOrderCount} đơn trên trang này`
                  : "Một số đơn ở trang khác"}{" "}
                không có bản chụp công thức và đang dùng công thức hiện tại.
                Tổng lịch sử của các đơn đó có thể thay đổi nếu công thức vừa
                được cập nhật.
              </span>
            </span>
          </IngredientStatus>
        ) : null}

        {loading ? (
          <div
            className="flex min-h-72 items-center justify-center rounded-admin-panel border border-admin-border bg-admin-surface text-sm text-admin-text-secondary"
            role="status"
          >
            Đang tổng hợp nhu cầu nguyên liệu...
          </div>
        ) : report ? (
          <>
            <section aria-labelledby="demand-summary-heading">
              <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2
                    id="demand-summary-heading"
                    className="text-base font-semibold text-admin-text-primary"
                  >
                    Tổng nhu cầu
                  </h2>
                  <p className="mt-1 text-xs text-admin-text-muted">
                    Theo {report.period.dateBasis} · {report.period.timeZone} ·
                    tạo lúc {formatDateTime(report.generatedAt)}
                  </p>
                </div>
                <span className="text-xs text-admin-text-muted">
                  {report.summary.length} nguyên liệu
                </span>
              </div>
              {report.summary.length ? (
                <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
                  {report.summary.map((item, index) => (
                    <SummaryCard
                      key={
                        item.ingredientId ?? `${item.ingredientName}-${index}`
                      }
                      item={item}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-admin-panel border border-dashed border-admin-border bg-admin-surface px-5 py-12 text-center">
                  <p className="font-semibold text-admin-text-primary">
                    Không phát sinh nhu cầu
                  </p>
                  <p className="mt-1 text-sm text-admin-text-secondary">
                    Không có nguyên liệu trong các đơn phù hợp với bộ lọc.
                  </p>
                </div>
              )}
            </section>

            <section aria-labelledby="demand-orders-heading">
              <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2
                    id="demand-orders-heading"
                    className="text-base font-semibold text-admin-text-primary"
                  >
                    Chi tiết theo đơn giao
                  </h2>
                  <p className="mt-1 text-xs text-admin-text-muted">
                    Mở từng đơn để kiểm tra sản phẩm, công thức và nguồn dữ
                    liệu.
                  </p>
                </div>
                <span className="text-xs text-admin-text-muted">
                  {report.details.totalCount} đơn
                </span>
              </div>
              {report.details.items.length ? (
                <div className="space-y-3">
                  {report.details.items.map((order) => (
                    <details
                      key={order.orderId}
                      className="group overflow-hidden rounded-admin-panel border border-admin-border bg-admin-surface shadow-admin-panel"
                    >
                      <summary className="flex min-h-16 cursor-pointer list-none flex-wrap items-center justify-between gap-3 px-4 py-3 marker:content-none sm:px-5">
                        <div>
                          <span className="font-semibold text-admin-text-primary">
                            {order.orderCode}
                          </span>
                          <span className="ml-2 rounded-md bg-admin-muted px-2 py-1 text-[11px] font-semibold text-admin-text-secondary">
                            {statusOptions.find(
                              (option) => option.value === order.status,
                            )?.label ?? `Trạng thái ${order.status}`}
                          </span>
                          <p className="mt-1 text-xs text-admin-text-muted">
                            Giao {formatDateTime(order.deliveryAt)} ·{" "}
                            {order.items.length} sản phẩm
                          </p>
                        </div>
                        <span className="text-sm font-semibold text-admin-primary group-open:hidden">
                          Mở chi tiết
                        </span>
                        <span className="hidden text-sm font-semibold text-admin-primary group-open:inline">
                          Thu gọn
                        </span>
                      </summary>
                      <div className="border-t border-admin-border px-4 py-4 sm:px-5">
                        {order.usesLegacyRecipeFallback ? (
                          <div className="mb-4 rounded-admin-control border border-amber-300 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-950">
                            Đơn cũ này dùng công thức hiện tại làm dữ liệu dự
                            phòng.
                          </div>
                        ) : null}
                        <div className="space-y-4">
                          {order.items.map((item) => (
                            <article key={item.orderItemId}>
                              <div className="flex flex-wrap items-baseline justify-between gap-2">
                                <h3 className="text-sm font-semibold text-admin-text-primary">
                                  {item.productName}
                                  {item.productSku ? (
                                    <span className="ml-2 font-mono text-xs font-normal text-admin-text-muted">
                                      {item.productSku}
                                    </span>
                                  ) : null}
                                </h3>
                                <span className="text-sm tabular-nums text-admin-text-secondary">
                                  × {item.quantity}
                                </span>
                              </div>
                              {item.ingredients.length ? (
                                <>
                                  <dl className="mt-2 divide-y divide-admin-border/70 md:hidden">
                                    {item.ingredients.map((line, index) => (
                                      <div key={`mobile-${line.ingredientId ?? line.ingredientName}-${index}`} className="py-3 first:pt-2">
                                        <div className="flex items-start justify-between gap-3">
                                          <dt className="font-medium text-admin-text-primary">{line.ingredientName}</dt>
                                          <dd className="shrink-0 font-semibold tabular-nums text-admin-text-primary">{quantityWithUnit(line.totalBaseQuantity, line.baseUnitSymbol || line.baseUnitName)}</dd>
                                        </div>
                                        <p className="mt-1 text-xs text-admin-text-muted">
                                          Mỗi sản phẩm: {quantityWithUnit(line.perProductBaseQuantity, line.baseUnitSymbol || line.baseUnitName)} · {item.source === 1 ? "Bản chụp theo dòng đơn" : item.source === 3 ? "Đơn cũ chưa có bản chụp" : "Nguồn tương thích cũ"}
                                        </p>
                                      </div>
                                    ))}
                                  </dl>
                                <div className="mt-2 hidden overflow-x-auto md:block">
                                  <table className="w-full min-w-[36rem] text-left text-sm">
                                    <thead>
                                      <tr className="border-b border-admin-border text-xs text-admin-text-muted">
                                        <th className="py-2 pr-3 font-medium">
                                          Nguyên liệu
                                        </th>
                                        <th className="px-3 py-2 font-medium">
                                          Mỗi sản phẩm
                                        </th>
                                        <th className="px-3 py-2 font-medium">
                                          Tổng
                                        </th>
                                        <th className="py-2 pl-3 text-right font-medium">
                                          Nguồn
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {item.ingredients.map((line, index) => (
                                        <tr
                                          key={`${line.ingredientId ?? line.ingredientName}-${index}`}
                                          className="border-b border-admin-border/70 last:border-0"
                                        >
                                          <td className="py-2 pr-3 text-admin-text-primary">
                                            {line.ingredientName}
                                          </td>
                                          <td className="px-3 py-2 tabular-nums text-admin-text-secondary">
                                            {quantityWithUnit(
                                              line.perProductBaseQuantity,
                                              line.baseUnitSymbol ||
                                                line.baseUnitName,
                                            )}
                                          </td>
                                          <td className="px-3 py-2 font-semibold tabular-nums text-admin-text-primary">
                                            {quantityWithUnit(
                                              line.totalBaseQuantity,
                                              line.baseUnitSymbol ||
                                                line.baseUnitName,
                                            )}
                                          </td>
                                          <td className="py-2 pl-3 text-right text-xs text-admin-text-muted">
                                            {item.source === 1
                                              ? "Bản chụp theo dòng đơn"
                                              : item.source === 3
                                                ? "Đơn cũ chưa có bản chụp"
                                                : "Nguồn tương thích cũ"}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                                </>
                              ) : (
                                <p className="mt-2 text-xs text-admin-text-muted">
                                  {item.source === 3
                                    ? "Đơn cũ chưa có bản chụp nguyên liệu; hệ thống không tự tính lại từ sản phẩm hiện tại."
                                    : "Sản phẩm không có nguyên liệu."}
                                </p>
                              )}
                            </article>
                          ))}
                        </div>
                        <section
                          className="mt-5 border-t border-admin-border pt-4"
                          aria-label={`Tổng nguyên liệu đơn ${order.orderCode}`}
                        >
                          <div className="mb-2 flex items-center justify-between gap-3">
                            <h4 className="text-sm font-semibold text-admin-text-primary">
                              Tổng nguyên liệu của đơn
                            </h4>
                            <span className="text-xs text-admin-text-muted">
                              {order.totals.length} nguyên liệu
                            </span>
                          </div>
                          {order.totals.length ? (
                            <dl className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                              {order.totals.map((total, index) => (
                                <div
                                  key={`${total.ingredientId ?? total.ingredientCode}-${index}`}
                                  className="flex items-center justify-between gap-3 rounded-admin-control bg-admin-muted/45 px-3 py-2 text-sm"
                                >
                                  <dt
                                    className="min-w-0 truncate text-admin-text-secondary"
                                    title={total.ingredientName}
                                  >
                                    {total.ingredientName}
                                  </dt>
                                  <dd className="shrink-0 font-semibold tabular-nums text-admin-text-primary">
                                    {quantityWithUnit(
                                      total.totalBaseQuantity,
                                      total.baseUnitSymbol ||
                                        total.baseUnitName,
                                    )}
                                  </dd>
                                </div>
                              ))}
                            </dl>
                          ) : (
                            <p className="text-xs text-admin-text-muted">
                              Đơn này không phát sinh nhu cầu nguyên liệu.
                            </p>
                          )}
                        </section>
                      </div>
                    </details>
                  ))}
                </div>
              ) : (
                <div className="rounded-admin-panel border border-dashed border-admin-border bg-admin-surface px-5 py-10 text-center text-sm text-admin-text-muted">
                  Không có đơn giao phù hợp.
                </div>
              )}

              {report.details.totalPages > 1 ? (
                <div className="mt-4 flex flex-col gap-3 rounded-admin-control border border-admin-border bg-admin-surface px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-admin-text-secondary">
                    Trang {report.details.page}/{report.details.totalPages}
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setPage((current) => Math.max(1, current - 1))
                      }
                      disabled={!report.details.hasPrevious}
                      className="inline-flex h-11 items-center gap-1 rounded-admin-control border border-admin-border px-3 font-semibold text-admin-text-primary hover:bg-admin-muted disabled:opacity-40"
                    >
                      <ChevronLeft size={16} aria-hidden="true" /> Trước
                    </button>
                    <button
                      type="button"
                      onClick={() => setPage((current) => current + 1)}
                      disabled={!report.details.hasNext}
                      className="inline-flex h-11 items-center gap-1 rounded-admin-control border border-admin-border px-3 font-semibold text-admin-text-primary hover:bg-admin-muted disabled:opacity-40"
                    >
                      Sau <ChevronRight size={16} aria-hidden="true" />
                    </button>
                  </div>
                </div>
              ) : null}
            </section>
          </>
        ) : null}
      </div>
    </>
  );

  if (embedded) return content;

  return (
    <IngredientShell
      title="Nguyên liệu cần chuẩn bị"
      description="Tổng hợp nguyên liệu cần mua hoặc chuẩn bị theo ngày giao. Báo cáo này độc lập với Kho tồn và không làm giảm stock."
    >
      {content}
    </IngredientShell>
  );
};
