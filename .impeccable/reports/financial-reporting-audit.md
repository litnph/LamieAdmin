# Audit: financial-reporting

## Audit Health Score

| # | Dimension | Score | Key finding |
|---|---|---:|---|
| 1 | Accessibility | 3/4 | Semantic charts/tables are strong; drawers lack focus containment and return. |
| 2 | Performance | 3/4 | No heavy chart dependency or images; long cash ledgers currently render all rows. |
| 3 | Responsive design | 4/4 | 390px and 1440px captures pass without body overflow; mobile prioritizes key balances. |
| 4 | Theming | 3/4 | Lamie tokens are used consistently; overlay scrim uses one hard-coded ink value. |
| 5 | Implementation integrity | 3/4 | Product-specific domain layer and mock adapter are coherent; official detector unavailable. |
| **Total** |  | **16/20** | **Good** |

## Implementation integrity verdict

**Pass with hardening required.** Financial formulae live in `domain/reportCalculations.ts`, raw data stays behind `ReportingDataAdapter`, and the page consumes a typed view model. The implementation distinctly models completed delivery, multiple payments, refunds, customer advance, receivable, direct/operating expense and separate incurred/paid dates. The deterministic detector could not load because the Impeccable Windows engine download failed checksum verification; manual scans found no systemic anti-patterns.

## Findings

1. **P1 — Modal focus lifecycle incomplete**
   - Location: `ReportChrome.tsx`, `ReportTables.tsx`.
   - Category: Accessibility.
   - Impact: keyboard/screen-reader users can tab into obscured page content and lose their trigger position after close.
   - Standard: WCAG 2.4.3 Focus Order; WAI-ARIA modal dialog pattern.
   - Recommendation: trap Tab/Shift+Tab, lock background scroll, Escape close, restore triggering element.
   - Suggested command: `/impeccable harden financial-reporting`.

2. **P1 — Export format promise does not match implementation**
   - Location: `ReportChrome.tsx`, inherited `reportsApi.downloadExcel`.
   - Category: Implementation integrity.
   - Impact: user expects `.xlsx` but receives `.xls`, reducing trust and causing policy/tooling friction.
   - Recommendation: use “Excel (.xls)” now and list real XLSX as backend work.
   - Suggested command: `/impeccable clarify financial-reporting`.

3. **P2 — URL parameters are only partially normalized**
   - Location: `FinancialReportPage.tsx#fromSearchParams`.
   - Category: Error prevention.
   - Impact: manually shared malformed enum/date parameters can silently empty the report or produce invalid comparison ranges.
   - Recommendation: validate enum sets, calendar-valid dates and `from <= to`, then fall back atomically.
   - Suggested command: `/impeccable harden financial-reporting`.

4. **P2 — Long transaction lists lack an explicit rendering ceiling**
   - Location: `CashTransactionsTable` and other desktop tables.
   - Category: Performance.
   - Impact: an API-backed ledger with thousands of rows would create excessive DOM nodes and slow keyboard traversal.
   - Recommendation: paginate/server-page or progressively reveal 50 rows while aggregates remain complete.
   - Suggested command: `/impeccable optimize financial-reporting`.

5. **P3 — Tab pattern has no arrow-key roving focus**
   - Location: `ReportChrome.tsx#ReportTabs`.
   - Category: Accessibility.
   - Impact: keyboard users can still Tab through all tabs but do not get the expected Left/Right interaction.
   - Recommendation: implement roving tabIndex and ArrowLeft/ArrowRight/Home/End.
   - Suggested command: `/impeccable harden financial-reporting`.

## Positive findings

- Monetary formatting is centralized with `vi-VN`, VND and tabular numerals.
- Charts expose buttons, visible legends and screen-reader tables; trend meaning includes labels/signs, not color alone.
- Loading skeleton, actionable empty state, API error retry, URL state and reduced-motion support are present.
- No large new dependency was added; chart rendering is lightweight HTML/CSS.

## Recommended actions

1. **P1 `/impeccable harden financial-reporting`** — normalize URL state, harden modal focus, add roving tabs and bound long tables.
2. **P1 `/impeccable clarify financial-reporting`** — make export format and source status claims exact.
3. **P3 `/impeccable polish financial-reporting`** — final alignment, focus and microcopy pass after validation.
