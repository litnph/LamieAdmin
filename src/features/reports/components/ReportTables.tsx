import React, { useCallback, useEffect, useState } from "react";
import { ExternalLink, FileText, RotateCcw, X } from "@/shared/icons/lucideAnimated";
import type {
  CashTransactionRow,
  PaymentTransaction,
  ReceivableOrderRow,
  RecognizedOrderRow,
  ReportExpense,
  ReportOrder,
} from "../types/reporting.types";
import {
  formatReportDate,
  formatVnd,
  paymentMethodLabels,
} from "../utils/reportFormatters";
import { useDialogFocus } from "../hooks/useDialogFocus";

const orderStatusLabels = {
  created: "Mới tạo",
  producing: "Đang làm",
  shipping: "Đang giao",
  completed: "Hoàn tất",
  cancelled: "Đã hủy",
} as const;
const paymentStatusLabels = {
  unpaid: "Chưa thanh toán",
  deposited: "Đã cọc",
  paid: "Đã thanh toán đủ",
  overpaid: "Thanh toán dư",
  refunded: "Đã hoàn",
} as const;
const paymentKindLabels = {
  deposit: "Tiền cọc",
  remainder: "Thanh toán còn lại",
  full: "Thanh toán toàn bộ",
  refund: "Hoàn tiền",
  expense: "Khoản chi",
} as const;

const Badge: React.FC<{
  children: React.ReactNode;
  tone?: "success" | "warning" | "error" | "info" | "neutral";
}> = ({ children, tone = "neutral" }) => {
  const classes = {
    success: "bg-admin-status-success/10 text-admin-status-success",
    warning: "bg-admin-status-warning/10 text-admin-status-warning",
    error: "bg-admin-status-error/10 text-admin-status-error",
    info: "bg-admin-status-info/10 text-admin-status-info",
    neutral: "bg-admin-muted text-admin-text-secondary",
  };
  return (
    <span
      className={`inline-flex rounded-md px-2 py-1 text-[11px] font-semibold ${classes[tone]}`}
    >
      {children}
    </span>
  );
};

export const EmptyReportState: React.FC<{
  filtered?: boolean;
  onReset: () => void;
}> = ({ filtered = true, onReset }) => (
  <div className="border-y border-admin-border py-12 text-center">
    <FileText
      size={28}
      className="mx-auto text-admin-text-muted"
      aria-hidden="true"
    />
    <h3 className="mt-3 text-base font-semibold text-admin-text-primary">
      Chưa có dữ liệu phù hợp
    </h3>
    <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-admin-text-secondary">
      {filtered
        ? "Hãy mở rộng khoảng ngày hoặc xóa bớt bộ lọc để xem các giao dịch liên quan."
        : "Dữ liệu sẽ xuất hiện sau khi có đơn hoàn tất, thanh toán hoặc khoản chi."}
    </p>
    {filtered ? (
      <button
        type="button"
        onClick={onReset}
        className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-admin-control border border-admin-border px-4 text-sm font-semibold text-admin-text-primary hover:bg-admin-muted"
      >
        <RotateCcw size={16} /> Xóa bộ lọc
      </button>
    ) : null}
  </div>
);

const TableFrame: React.FC<{
  title: string;
  description: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}> = ({ title, description, children, action }) => (
  <section
    className="overflow-hidden border border-admin-border bg-admin-surface"
    aria-labelledby={`${title}-table-title`}
  >
    <header className="flex flex-col gap-3 border-b border-admin-border px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-5">
      <div>
        <h2
          id={`${title}-table-title`}
          className="text-base font-semibold text-admin-text-primary"
        >
          {title}
        </h2>
        <p className="mt-1 text-xs leading-5 text-admin-text-secondary">
          {description}
        </p>
      </div>
      {action}
    </header>
    {children}
  </section>
);

export const RecognizedOrdersTable: React.FC<{
  rows: RecognizedOrderRow[];
  onOrder: (order: ReportOrder) => void;
  onReset: () => void;
}> = ({ rows, onOrder, onReset }) => (
  <TableFrame
    title="Đơn hàng được ghi nhận"
    description="Chỉ gồm đơn hoàn tất theo ngày khách thực nhận hoa và điều chỉnh doanh thu hợp lệ."
  >
    {rows.length === 0 ? (
      <EmptyReportState onReset={onReset} />
    ) : (
      <>
        <div className="divide-y divide-admin-border md:hidden">
          {rows.map((row) => (
            <article key={row.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-semibold text-admin-text-primary">{row.code}</h3>
                  <p className="mt-1 truncate text-sm text-admin-text-secondary">{row.customerName}</p>
                </div>
                <Badge tone={row.paymentStatus === "paid" ? "success" : row.paymentStatus === "overpaid" ? "warning" : "info"}>
                  {paymentStatusLabels[row.paymentStatus]}
                </Badge>
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
                <div><dt className="text-admin-text-muted">Ngày nhận thực tế</dt><dd className="mt-1 font-medium text-admin-text-primary">{formatReportDate(row.completedAt, true)}</dd></div>
                <div><dt className="text-admin-text-muted">Doanh thu</dt><dd className="mt-1 font-semibold tabular-nums text-admin-text-primary">{formatVnd(row.recognizedRevenue)}</dd></div>
                <div className="col-span-2"><dt className="text-admin-text-muted">Đã thanh toán ròng</dt><dd className="mt-1 font-medium tabular-nums text-admin-text-secondary">{formatVnd(row.netPaid)}</dd></div>
              </dl>
              <button type="button" onClick={() => onOrder(row)} className="mt-3 min-h-11 text-sm font-semibold text-admin-primary">Xem chi tiết</button>
            </article>
          ))}
        </div>
        <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[62rem] text-left text-sm">
          <thead className="bg-admin-muted text-xs text-admin-text-secondary">
            <tr>
              <th className="px-4 py-3 sm:px-5">Mã đơn</th>
              <th className="px-4 py-3">Khách hàng</th>
              <th className="px-4 py-3">Ngày nhận thực tế</th>
              <th className="px-4 py-3 text-right">Doanh thu ghi nhận</th>
              <th className="px-4 py-3 text-right">Đã thanh toán ròng</th>
              <th className="px-4 py-3">Thanh toán</th>
              <th className="px-4 py-3 text-right sm:px-5">Chi tiết</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-admin-border">
            {rows.map((row) => (
              <tr key={row.id} className="hover:bg-admin-muted/55">
                <th className="px-4 py-3 font-semibold text-admin-text-primary sm:px-5">
                  {row.code}
                </th>
                <td className="px-4 py-3 text-admin-text-secondary">
                  {row.customerName}
                </td>
                <td className="px-4 py-3 text-admin-text-secondary">
                  {formatReportDate(row.completedAt, true)}
                </td>
                <td className="px-4 py-3 text-right font-semibold tabular-nums text-admin-text-primary">
                  {formatVnd(row.recognizedRevenue)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-admin-text-secondary">
                  {formatVnd(row.netPaid)}
                </td>
                <td className="px-4 py-3">
                  <Badge
                    tone={
                      row.paymentStatus === "paid"
                        ? "success"
                        : row.paymentStatus === "overpaid"
                          ? "warning"
                          : "info"
                    }
                  >
                    {paymentStatusLabels[row.paymentStatus]}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-right sm:px-5">
                  <button
                    type="button"
                    onClick={() => onOrder(row)}
                    className="min-h-11 font-semibold text-admin-primary hover:underline"
                  >
                    Xem
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </>
    )}
  </TableFrame>
);

export const CashTransactionsTable: React.FC<{
  rows: CashTransactionRow[];
  onReset: () => void;
}> = ({ rows, onReset }) => {
  const [visibleCount, setVisibleCount] = useState(50);
  useEffect(() => setVisibleCount(50), [rows]);
  const visibleRows = rows.slice(0, visibleCount);
  return (
    <TableFrame
      title="Nhật ký giao dịch tiền"
      description="Theo ngày thu hoặc chi thực tế; giao dịch thất bại và bị hủy không được cộng."
    >
      {rows.length === 0 ? (
        <EmptyReportState onReset={onReset} />
      ) : (
        <>
          <div className="divide-y divide-admin-border md:hidden">
            {visibleRows.map((row) => (
              <article key={row.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold text-admin-text-primary">{row.reference}</h3>
                    <p className="mt-1 text-xs text-admin-text-muted">{formatReportDate(row.occurredAt, true)}</p>
                  </div>
                  <strong className={`shrink-0 text-sm tabular-nums ${row.direction === "in" ? "text-admin-status-success" : "text-admin-text-primary"}`}>
                    {row.direction === "in" ? "+" : "−"}{formatVnd(row.amount)}
                  </strong>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Badge tone={row.direction === "in" ? "success" : row.kind === "refund" ? "warning" : "error"}>
                    {paymentKindLabels[row.kind as keyof typeof paymentKindLabels] ?? row.kind}
                  </Badge>
                  <span className="text-xs text-admin-text-secondary">{row.counterparty}</span>
                  <span className="text-xs text-admin-text-muted">· {row.method ? paymentMethodLabels[row.method] : "Chưa có phương thức"}</span>
                </div>
              </article>
            ))}
          </div>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[58rem] text-left text-sm">
              <thead className="bg-admin-muted text-xs text-admin-text-secondary">
                <tr>
                  <th className="px-4 py-3 sm:px-5">Thời điểm</th>
                  <th className="px-4 py-3">Loại</th>
                  <th className="px-4 py-3">Tham chiếu</th>
                  <th className="px-4 py-3">Đối tượng</th>
                  <th className="px-4 py-3">Phương thức</th>
                  <th className="px-4 py-3 text-right sm:px-5">Số tiền</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-admin-border">
                {visibleRows.map((row) => (
                  <tr key={row.id} className="hover:bg-admin-muted/55">
                    <td className="px-4 py-3 text-admin-text-secondary sm:px-5">
                      {formatReportDate(row.occurredAt, true)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        tone={
                          row.direction === "in"
                            ? "success"
                            : row.kind === "refund"
                              ? "warning"
                              : "error"
                        }
                      >
                        {paymentKindLabels[
                          row.kind as keyof typeof paymentKindLabels
                        ] ?? row.kind}
                      </Badge>
                    </td>
                    <th className="px-4 py-3 font-semibold text-admin-text-primary">
                      {row.reference}
                    </th>
                    <td className="px-4 py-3 text-admin-text-secondary">
                      {row.counterparty}
                    </td>
                    <td className="px-4 py-3 text-admin-text-secondary">
                      {row.method ? paymentMethodLabels[row.method] : "—"}
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-semibold tabular-nums sm:px-5 ${row.direction === "in" ? "text-admin-status-success" : "text-admin-text-primary"}`}
                    >
                      <span className="sr-only">
                        {row.direction === "in" ? "Tiền vào" : "Tiền ra"}{" "}
                      </span>
                      {row.direction === "in" ? "+" : "−"}
                      {formatVnd(row.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {visibleRows.length < rows.length ? (
            <div className="border-t border-admin-border p-3 text-center">
              <button
                type="button"
                onClick={() => setVisibleCount((count) => count + 50)}
                className="min-h-11 px-4 text-sm font-semibold text-admin-primary hover:underline"
              >
                Hiển thị thêm 50 giao dịch ({rows.length - visibleRows.length}{" "}
                còn lại)
              </button>
            </div>
          ) : null}
        </>
      )}
    </TableFrame>
  );
};

export const ExpensesTable: React.FC<{
  rows: ReportExpense[];
  onReset: () => void;
}> = ({ rows, onReset }) => (
  <TableFrame
    title="Danh sách khoản chi"
    description="Ngày phát sinh phục vụ hiệu quả kinh doanh; ngày thanh toán phục vụ dòng tiền."
    action={
      <a
        href="/admin/settings/expense-categories"
        className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-admin-primary hover:underline"
      >
        <ExternalLink size={15} /> Quản lý danh mục
      </a>
    }
  >
    {rows.length === 0 ? (
      <EmptyReportState onReset={onReset} />
    ) : (
      <>
        <div className="divide-y divide-admin-border md:hidden">
          {rows.map((row) => (
            <article key={row.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-semibold text-admin-text-primary">{row.description}</h3>
                  <p className="mt-1 truncate text-sm text-admin-text-secondary">{row.categoryName} · {row.vendor}</p>
                </div>
                <strong className="shrink-0 text-sm tabular-nums text-admin-text-primary">{formatVnd(row.amount)}</strong>
              </div>
              {row.note ? <p className="mt-3 text-xs leading-5 text-admin-text-secondary">{row.note}</p> : null}
              <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
                <div><dt className="text-admin-text-muted">Ngày phát sinh</dt><dd className="mt-1 font-medium text-admin-text-primary">{formatReportDate(row.incurredAt)}</dd></div>
                <div><dt className="text-admin-text-muted">Ngày thanh toán</dt><dd className="mt-1 font-medium text-admin-text-primary">{formatReportDate(row.paidAt)}</dd></div>
                <div><dt className="text-admin-text-muted">Trạng thái</dt><dd className="mt-1"><Badge tone={row.paidAt ? "success" : "warning"}>{row.paidAt ? "Đã thanh toán" : "Chưa thanh toán"}</Badge></dd></div>
                <div><dt className="text-admin-text-muted">Phương thức</dt><dd className="mt-1 font-medium text-admin-text-primary">{row.method ? paymentMethodLabels[row.method] : "—"}</dd></div>
              </dl>
            </article>
          ))}
        </div>
        <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[72rem] text-left text-sm">
          <thead className="bg-admin-muted text-xs text-admin-text-secondary">
            <tr>
              <th className="px-4 py-3 sm:px-5">Khoản chi</th>
              <th className="px-4 py-3">Danh mục</th>
              <th className="px-4 py-3">Nhà cung cấp/người nhận</th>
              <th className="px-4 py-3">Ngày phát sinh</th>
              <th className="px-4 py-3">Ngày thanh toán</th>
              <th className="px-4 py-3">Trạng thái</th>
              <th className="px-4 py-3">Phương thức</th>
              <th className="px-4 py-3 text-right sm:px-5">Số tiền</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-admin-border">
            {rows.map((row) => (
              <tr key={row.id} className="hover:bg-admin-muted/55">
                <th className="px-4 py-3 font-semibold text-admin-text-primary sm:px-5">
                  {row.description}
                  {row.note ? (
                    <span className="mt-1 block max-w-xs truncate text-xs font-normal text-admin-text-secondary">
                      {row.note}
                    </span>
                  ) : null}
                </th>
                <td className="px-4 py-3 text-admin-text-secondary">
                  {row.categoryName}
                </td>
                <td className="px-4 py-3 text-admin-text-secondary">
                  {row.vendor}
                </td>
                <td className="px-4 py-3 text-admin-text-secondary">
                  {formatReportDate(row.incurredAt)}
                </td>
                <td className="px-4 py-3 text-admin-text-secondary">
                  {formatReportDate(row.paidAt)}
                </td>
                <td className="px-4 py-3">
                  <Badge tone={row.paidAt ? "success" : "warning"}>
                    {row.paidAt ? "Đã thanh toán" : "Chưa thanh toán"}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-admin-text-secondary">
                  {row.method ? paymentMethodLabels[row.method] : "—"}
                </td>
                <td className="px-4 py-3 text-right font-semibold tabular-nums text-admin-text-primary sm:px-5">
                  {formatVnd(row.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </>
    )}
  </TableFrame>
);

export const ReceivablesTable: React.FC<{
  rows: ReceivableOrderRow[];
  onOrder: (order: ReportOrder) => void;
  onReset: () => void;
}> = ({ rows, onOrder, onReset }) => (
  <TableFrame
    title="Đơn cần theo dõi"
    description="Ưu tiên đơn quá hạn hoặc sắp giao nhưng chưa thanh toán đủ."
  >
    {rows.length === 0 ? (
      <EmptyReportState onReset={onReset} />
    ) : (
      <>
        <div className="divide-y divide-admin-border md:hidden">
          {rows.map((row) => (
            <article key={row.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-admin-text-primary">
                    {row.code}
                  </h3>
                  <p className="mt-1 text-sm text-admin-text-secondary">
                    {row.customerName}
                  </p>
                </div>
                <Badge
                  tone={
                    row.isOverdue
                      ? "error"
                      : row.isDueSoon
                        ? "warning"
                        : row.advance
                          ? "info"
                          : "neutral"
                  }
                >
                  {row.isOverdue
                    ? "Quá hạn"
                    : row.isDueSoon
                      ? "Sắp giao"
                      : row.advance
                        ? "Đã nhận trước"
                        : paymentStatusLabels[row.paymentStatus]}
                </Badge>
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <dt className="text-admin-text-secondary">Ngày nhận hoa</dt>
                  <dd className="mt-1 font-medium text-admin-text-primary">
                    {formatReportDate(
                      row.completedAt ?? row.expectedDeliveryAt,
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-admin-text-secondary">Tổng đơn</dt>
                  <dd className="mt-1 font-semibold tabular-nums text-admin-text-primary">
                    {formatVnd(row.total)}
                  </dd>
                </div>
                <div>
                  <dt className="text-admin-text-secondary">Đã thanh toán</dt>
                  <dd className="mt-1 font-semibold tabular-nums text-admin-status-success">
                    {formatVnd(row.netPaid)}
                  </dd>
                </div>
                <div>
                  <dt className="text-admin-text-secondary">Còn phải thu</dt>
                  <dd className="mt-1 font-semibold tabular-nums text-admin-status-warning">
                    {formatVnd(row.receivable)}
                  </dd>
                </div>
              </dl>
              <button
                type="button"
                onClick={() => onOrder(row)}
                className="mt-3 min-h-11 text-sm font-semibold text-admin-primary"
              >
                Xem timeline
              </button>
            </article>
          ))}
        </div>
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[74rem] text-left text-sm">
            <thead className="bg-admin-muted text-xs text-admin-text-secondary">
              <tr>
                <th className="px-4 py-3 sm:px-5">Mã đơn</th>
                <th className="px-4 py-3">Khách hàng</th>
                <th className="px-4 py-3">Ngày nhận hoa</th>
                <th className="px-4 py-3 text-right">Tổng đơn</th>
                <th className="px-4 py-3 text-right">Đã thanh toán</th>
                <th className="px-4 py-3 text-right">Còn phải thu</th>
                <th className="px-4 py-3">Đơn hàng</th>
                <th className="px-4 py-3">Thanh toán</th>
                <th className="px-4 py-3 text-right sm:px-5">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-admin-border">
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-admin-muted/55">
                  <th className="px-4 py-3 font-semibold text-admin-text-primary sm:px-5">
                    {row.code}
                  </th>
                  <td className="px-4 py-3 text-admin-text-secondary">
                    {row.customerName}
                  </td>
                  <td className="px-4 py-3 text-admin-text-secondary">
                    {formatReportDate(
                      row.completedAt ?? row.expectedDeliveryAt,
                    )}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {formatVnd(row.total)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-admin-status-success">
                    {formatVnd(row.netPaid)}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums text-admin-status-warning">
                    {formatVnd(row.receivable)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      tone={row.status === "completed" ? "success" : "info"}
                    >
                      {orderStatusLabels[row.status]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      tone={
                        row.isOverdue
                          ? "error"
                          : row.isDueSoon
                            ? "warning"
                            : "neutral"
                      }
                    >
                      {row.isOverdue
                        ? "Quá hạn"
                        : row.isDueSoon
                          ? "Sắp đến hạn"
                          : paymentStatusLabels[row.paymentStatus]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right sm:px-5">
                    <button
                      type="button"
                      onClick={() => onOrder(row)}
                      className="min-h-11 font-semibold text-admin-primary hover:underline"
                    >
                      Xem
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    )}
  </TableFrame>
);

export const OrderTimelineDrawer: React.FC<{
  order: ReportOrder | null;
  payments: PaymentTransaction[];
  onClose: () => void;
}> = ({ order, payments, onClose }) => {
  const close = useCallback(onClose, [onClose]);
  const dialogRef = useDialogFocus<HTMLElement>(Boolean(order), close);
  if (!order) return null;
  const events = [
    {
      date: order.createdAt,
      title: "Đặt đơn",
      detail: `Tổng giá trị ${formatVnd(order.productRevenueAfterDiscount + order.shippingFeeCharged)}`,
    },
    ...payments
      .filter(
        (payment) =>
          payment.orderId === order.id && payment.status === "succeeded",
      )
      .map((payment) => ({
        date: payment.paidAt,
        title: paymentKindLabels[payment.kind],
        detail: `${payment.kind === "refund" ? "−" : "+"}${formatVnd(payment.amount)} · ${paymentMethodLabels[payment.method]}${payment.note ? ` · ${payment.note}` : ""}`,
      })),
    {
      date: order.expectedDeliveryAt,
      title: "Ngày nhận dự kiến",
      detail: formatReportDate(order.expectedDeliveryAt, true),
    },
    ...(order.completedAt
      ? [
          {
            date: order.completedAt,
            title: "Khách nhận hoa · đơn hoàn tất",
            detail: formatReportDate(order.completedAt, true),
          },
        ]
      : []),
  ].sort((a, b) => a.date.localeCompare(b.date));
  return (
    <div
      className="fixed inset-0 z-admin-modal flex justify-end bg-[#292623]/35"
      role="presentation"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) onClose();
      }}
    >
      <aside
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="order-timeline-title"
        className="h-full w-full max-w-md overflow-y-auto bg-admin-surface p-5 shadow-admin-popover"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2
              id="order-timeline-title"
              className="text-xl font-semibold text-admin-text-primary"
            >
              {order.code}
            </h2>
            <p className="mt-1 text-sm text-admin-text-secondary">
              {order.customerName}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng chi tiết đơn"
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-admin-control text-admin-text-secondary hover:bg-admin-muted"
          >
            <X size={19} />
          </button>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <Badge
            tone={
              order.status === "completed"
                ? "success"
                : order.status === "cancelled"
                  ? "error"
                  : "info"
            }
          >
            {orderStatusLabels[order.status]}
          </Badge>
          <Badge>{order.channel}</Badge>
        </div>
        <ol className="relative mt-7 space-y-6 before:absolute before:bottom-2 before:left-[5px] before:top-2 before:w-px before:bg-admin-border">
          {events.map((event, index) => (
            <li key={`${event.date}-${index}`} className="relative pl-7">
              <span
                className="absolute left-0 top-1.5 h-3 w-3 rounded-full border-2 border-admin-surface bg-admin-primary ring-1 ring-admin-primary/30"
                aria-hidden="true"
              />
              <time className="text-xs font-medium text-admin-text-secondary">
                {formatReportDate(event.date, true)}
              </time>
              <h3 className="mt-1 text-sm font-semibold text-admin-text-primary">
                {event.title}
              </h3>
              <p className="mt-1 text-xs leading-5 text-admin-text-secondary">
                {event.detail}
              </p>
            </li>
          ))}
        </ol>
        <a
          href={`/admin/orders/${order.id}`}
          className="mt-8 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-admin-control bg-admin-primary px-4 text-sm font-semibold text-admin-primary-foreground"
        >
          Mở đơn hàng <ExternalLink size={16} />
        </a>
      </aside>
    </div>
  );
};
