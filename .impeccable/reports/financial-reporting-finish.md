# Finish report: financial-reporting

## Outcome

The feature now answers three questions independently and without mixing date bases:

1. Recognized revenue, recognized expense, profit and margin for completed deliveries.
2. Actual money received, refunded and paid on transaction dates.
3. Customer advances for undelivered orders and net receivables at the report cutoff.

## Impeccable sequence

- `init`: `PRODUCT.md` records the operator personas, Vietnamese/VND, `Asia/Ho_Chi_Minh`, back-office priorities and financial recognition rules.
- `document`: the existing Lamie product/design truth and tokens were inspected and retained; no design-system replacement was introduced.
- `shape`: `.impeccable/briefs/financial-reporting.md` defines information architecture, flows, states and API boundaries.
- `craft`: five report tabs, URL-backed filters, typed mock adapter, centralized calculations, drill-down and exports were implemented.
- `live`: Playwright was used for browser iteration and fresh desktop/mobile captures.
- `critique` and `audit`: reports were written before hardening. Their concrete P1/P2 findings are resolved: dialog focus lifecycle, URL normalization, bounded transaction rendering, roving tab keys and truthful `.xls` labeling.
- `harden`: overlays trap/restore focus, lock body scroll and close with Escape; malformed shared URLs fall back safely.
- `adapt`: controls and receivable rows reflow for mobile; advanced filters use a bottom sheet; tables scroll intentionally where dense comparison is essential.
- `clarify`: each tab names its date basis, the cash-flow caveat is repeated in context, and the source status says mock data is not connected to an API.
- `polish`: KPI hierarchy, alignment, Vietnamese labels, tabular currency figures, focus states and restrained motion were refined.

## Detector

The official Impeccable detector was invoked once but the launcher rejected the downloaded Windows engine because its checksum did not match. The fallback source scan found no purple/blue gradients, glass decoration, bounce/elastic motion, gray-on-color text, nested-card hierarchy or generic icon tiles. Fully rounded elements are limited to semantic dots, timeline nodes and data bars.

## Verification

- `npm run typecheck`: pass.
- `npm run test:unit`: 4/4 pass, including all three required acceptance scenarios and a refund/receivable regression.
- `npx playwright test tests/e2e/reports.spec.ts --project=chromium`: 8/8 pass.
- Full `npm run test:e2e`: 128 pass, 1 skip, 1 unrelated pre-existing order-editor failure. Re-running that exact test reproduces a missing product-search option; no report file participates in its path.
- `npm run build`: pass.
- Reviewed sizes: 1440 desktop, 1024/768 tablet/zoom, 390 and 320 mobile.
- Accessibility coverage includes chart summaries, legends/tooltips, semantic tables, 44px controls, keyboard tab navigation, modal focus containment, visible focus, non-color status cues and reduced-motion handling.

## Evidence

- Desktop: `.impeccable/review/desktop.png`
- Mobile: `.impeccable/review/mobile.png`
- Backend contract: `docs/FINANCIAL_REPORTING_HANDOFF.md`

