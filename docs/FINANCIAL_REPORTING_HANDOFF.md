# Financial reporting backend handoff

The current report UI runs against a typed mock adapter. Replacing it with production data should preserve the domain contract in `src/features/reports/types/reporting.types.ts` and the calculation rules in `src/features/reports/domain/reportCalculations.ts`.

## Required order and payment data

- Stable order, customer and sales-channel identifiers.
- Product subtotal after discount, customer delivery fee and order-level adjustments as separate amounts.
- `expectedDeliveryAt`, `completedAt` (the actual flower-received/completion timestamp) and cancellation state.
- A payment ledger that supports multiple entries per order: kind, status, amount, `paidAt`, method and reference.
- Refund/adjustment entries with `affectsRecognizedRevenue` so retained deposits and non-revenue refunds follow configured policy instead of a frontend assumption.
- Server-calculated permission flags for viewing financial details and managing expense categories.

## Required expense data

- Category, vendor/payee, note and evidence URL when available.
- Direct-versus-operating classification and optional linked order ID.
- Both `incurredAt` and nullable `paidAt`; do not collapse them into one date.
- Payment status, method and amount. A direct order expense is recognized on the linked order completion date, while operating expense uses `incurredAt`; cash outflow uses `paidAt` only.

## Reporting API expectations

- Apply `Asia/Ho_Chi_Minh` consistently when converting business dates and return an authoritative `generatedAt` timestamp.
- Accept the filters represented in the URL: range, grouping, order/payment status, payment method, expense category and sales channel.
- Return aggregates and cursor-paged drill-down rows from the same versioned snapshot so totals and lists reconcile.
- Preserve stable IDs for chart-to-table drill-down and order timeline navigation.
- Provide explicit loading/error semantics and retry-safe GET endpoints.
- Add a true XLSX export endpoint. The inherited endpoint currently returns SpreadsheetML `.xls`, so the UI deliberately labels it `Excel (.xls)`.

## Policy decisions the backend must own

- Whether a cancelled-order deposit is refunded, retained as other income, or recognized under another configured rule.
- Which refund/adjustment types reduce recognized revenue.
- How overpayments become credit, refund liability or customer balance.
- Which roles may create, edit or deactivate expense categories.
- Whether payment and expense records can be edited after a locked accounting period.

