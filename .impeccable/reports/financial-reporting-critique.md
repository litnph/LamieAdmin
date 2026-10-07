⚠️ DEGRADED: single-context (sub-agents were not authorized for this session; Impeccable engine also failed checksum verification)

# Critique: financial-reporting

Target: `src/features/reports/pages/FinancialReportPage.tsx`  
Evidence: `.impeccable/review/desktop.png`, `.impeccable/review/mobile.png`

## Design Health Score

| # | Heuristic | Score | Key issue |
|---|---|---:|---|
| 1 | Visibility of system status | 3/4 | Loading, retry and export-in-progress exist; export success has no toast. |
| 2 | Match system / real world | 4/4 | Financial terms and three date bases are explicit and accurate. |
| 3 | User control and freedom | 3/4 | Reset, deselect and Escape exist; drawers need full focus containment/return. |
| 4 | Consistency and standards | 4/4 | Reuses Lamie tokens, controls, status vocabulary and app shell. |
| 5 | Error prevention | 3/4 | Date inputs constrain each other; malformed URL values still need normalization. |
| 6 | Recognition rather than recall | 4/4 | Labels, legends, tooltips, basis line and formula details are co-located. |
| 7 | Flexibility and efficiency | 3/4 | Quick ranges, URL filters and chart drill-down support repeat use; no saved views. |
| 8 | Aesthetic and minimalist design | 3/4 | Clear hierarchy after KPI reflow; toolbar remains deliberately dense on desktop. |
| 9 | Error recovery | 3/4 | Plain-language error and retry preserve context; export errors share the page alert. |
| 10 | Help and documentation | 3/4 | Contextual definitions and formulas exist; no link to finance policy documentation. |
| **Total** |  | **33/40** | **Good** |

## Design specificity verdict

Authored for Lamie rather than interchangeable analytics UI. The strongest evidence is the structural split between recognized revenue, actual cash and customer advances/receivables; shipping revenue and shipping cost remain visibly separate. Warm paper surfaces and restrained botanical accent fit the incumbent back-office identity without decorative floristry.

Deterministic Impeccable scan could not run because the official launcher rejected its downloaded Windows engine with a checksum mismatch. A manual source scan found no gradients, glass decoration, bounce/elastic motion, gray-on-color text, nested card hierarchy or generic icon-tile headings. Rounded full shapes are limited to status dots, timeline nodes and thin data bars, so they are not card/pill violations.

## What works

- Primary and secondary KPIs no longer compete: revenue and profit lead, supporting composition/expense/margin values form a quieter second tier.
- Every tab states its own time basis, and the cash-flow warning repeats the distinction exactly where mistakes are most likely.
- Desktop tables and mobile receivable cards preserve drill-down; charts provide keyboard buttons, legends and screen-reader tables.

## Priority issues

1. **P1 — Excel contract is misleading.** UI says XLSX while the inherited endpoint downloads SpreadsheetML `.xls`; a finance tool must not overstate the export format. Fix: label it “Excel (.xls)” until backend provides real XLSX, or implement a true XLSX endpoint.
2. **P2 — Overlay hardening is incomplete.** Escape works in the order drawer, but advanced filter and order detail do not trap focus, restore focus to the trigger, or lock background scroll. Fix: add a reusable dialog-focus hook and Escape handling to both overlays; restore trigger focus on close.

## Persona red flags

- **Alex (power user):** filters and chart drill-down are quick, but there is no saved report view or keyboard accelerator. Acceptable for first release; URL persistence is the current expert path.
- **Sam (keyboard/screen reader):** chart bars are buttons and data tables exist, but focus can escape behind an open drawer. This is the one release-blocking accessibility gap.
- **Casey (mobile):** after adaptation, quick range and actions fit before cọc/công nợ KPIs. Long horizontal tab navigation remains intentional and scrollable but has no visible overflow cue.

## Minor observations

- Previous-period zero is now described as “Kỳ trước 0 ₫” instead of the misleading “Chưa có kỳ so sánh”.
- Negative values include a minus sign and labels, so meaning is not color-only.
- The sidebar shows “Không có mục điều hướng phù hợp” under test mocks; this is fixture scope, not the report surface.

Questions skipped: only 2 priority issues were found, and both have unambiguous fixes already requested by the delivery brief.

## Run notes

- Assessment A completed against fresh desktop/mobile captures before detector output.
- Assessment B CLI attempt failed on engine checksum; manual source-pattern scan used as fallback.
- No human overlay was claimed or injected. No critique-only server remained running.
