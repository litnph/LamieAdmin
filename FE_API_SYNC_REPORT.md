# FE Admin - API synchronization final report

Report date: 2026-07-27

## 1. Executive summary

The audit found 65 active FE method/route requirements and 40 backend endpoints before changes. Only Products and seven attribute resources exist in the provided backend; Auth, Users, Orders and Channels are entirely absent. Dashboard and Customers are client-side projections that depend on the missing Orders API.

The source-supported synchronization work is complete:

- Product create no longer sends an unused sale price as invalid zero.
- Product edit now has an item route compatible with FE while the old collection PUT remains available.
- Product update synchronizes scalar fields, price, thumbnail, translations, all five relation sets and the complete image list.
- Replacing/removing local product images schedules obsolete files for cleanup after persistence.
- Existing product validators now execute through a MediatR pipeline and reject invalid pricing, duplicate translation languages and non-image uploads.
- Category `sortOrder` is present in FE state/request and can no longer be silently overwritten with zero during ordinary edits.
- A .NET test project now runs five focused regression tests.
- The pre-existing nullable build warning is removed.

After changes, all 40 FE requirements for backend-supported modules are matched. The remaining 25 requirements are genuine missing APIs, not request-mapping defects.

| Final metric | Count |
| --- | ---: |
| Active FE endpoint requirements | 65 |
| Backend method/route endpoints | 41 |
| MATCHED | 40 |
| PARTIALLY_MATCHED | 0 |
| MISSING_API | 25 |
| UNUSED_API | 1 |
| Remaining BROKEN_FLOW | 6 |

The one unused endpoint is the original collection-route Product PUT retained for backward compatibility. The six remaining broken flows are Auth, Users, Orders, Channels, Dashboard and Customers.

## 2. Contract matrix

| Module | Endpoint/flow | Before | Change | After |
| --- | --- | --- | --- | --- |
| Products | POST `/api/settings/products` | PARTIALLY_MATCHED | blank sale price omitted; positive/cross-field validation aligned | MATCHED |
| Products | PUT `/api/settings/products/{id}` | PARTIALLY_MATCHED / BROKEN_FLOW | added route-id action; full aggregate synchronization and thumbnail-file binding | MATCHED |
| Products | PUT `/api/settings/products` | existing API contract | retained unchanged for old clients | UNUSED_API compatibility route |
| Products | GET list/detail, DELETE | MATCHED | no contract change | MATCHED |
| Categories | five attribute operations | PARTIALLY_MATCHED | FE reads, edits and sends `sortOrder` | MATCHED |
| Languages | five operations | MATCHED | no change | MATCHED |
| Collections | five operations | MATCHED | no change | MATCHED |
| Colors | five operations | MATCHED | no change | MATCHED |
| Occasions | five operations | MATCHED | no change | MATCHED |
| Styles | five operations | MATCHED | no change | MATCHED |
| Tags | five operations | MATCHED | no change | MATCHED |
| Auth | five operations | MISSING_API | not fabricated without identity/token contract | MISSING_API |
| Users | six operations | MISSING_API | not fabricated without user/role/password contract | MISSING_API |
| Orders | nine operations | MISSING_API | not fabricated without order schema and transition rules | MISSING_API |
| Channels | five operations | MISSING_API | not fabricated without channel domain/id policy | MISSING_API |
| Dashboard | order/product projection | BROKEN_FLOW | Product inventory path works; Orders still absent | BROKEN_FLOW |
| Customers | order projection | BROKEN_FLOW | no safe source-supported API change possible | BROKEN_FLOW |
| Promotions | no FE or API implementation | outside implemented source | no speculative feature added | Not implemented |

## 3. FE changes

| File | Change | Reason |
| --- | --- | --- |
| `src/features/product/pages/ProductCreatePage.tsx` | price must be positive; sale price must be zero/unused or below price; blank sale price is omitted; edit includes form id; price input min aligned | match backend nullable/decimal/domain contract and route identity |
| `src/features/settings/attributes/types/attributes.types.ts` | added optional `sortOrder` to attribute DTO base | backend Category DTO includes this field |
| `src/features/settings/attributes/pages/AttributesPage.tsx` | category draft preserves `sortOrder`, validates it and exposes an integer input | prevent update from resetting existing order |
| `FE_API_SYNC_AUDIT.md` | complete pre-fix system map, inventories, matrix, findings and assumptions | required audit evidence |
| `FE_API_SYNC_PLAN.md` | phased implementation plan with impact, compatibility, tests and blockers | required plan before code changes |
| `FE_API_SYNC_REPORT.md` | final before/after and command results | handoff and traceability |

No new FE dependency, API base URL, token key, route path or UI framework was introduced.

## 4. API changes

| File | Change | Reason |
| --- | --- | --- |
| `Lamie.API/Controllers/Settings/ProductController.cs` | added `PUT /api/settings/products/{id}`, id-conflict 400 envelope and cancellation propagation | match FE route while retaining old PUT |
| `Lamie.API/Program.cs` | registered product validators and generic MediatR validation behavior | execute existing rules consistently |
| `Lamie.Application/Common/Behaviors/ValidationBehavior.cs` | aggregates FluentValidation failures into existing application validation exception | preserve standard `{ success, code, message, errors }` format |
| `CreateProductValidator.cs` | sale-price, unique-language and image MIME rules | reject invalid request before handler/storage |
| `UpdateProductValidator.cs` | complete create-equivalent rules plus id | update contract parity |
| `UpdateProductCommand.cs` | added `ThumbnailFile` | bind the edit form field FE already sends |
| `UpdateProductHandler.cs` | full aggregate synchronization and obsolete local-file cleanup | fix silent stale-data flow |
| `Product.cs` | domain methods for details, atomic pricing, translation and relation synchronization | remove reflection and keep invariants in aggregate |
| `ProductTranslation.cs` | language validation and update method | support safe in-place synchronization |
| `ProductImage.cs` | updating an image reactivates it | make submitted active image state effective |
| `ProductDto.cs` | initialized non-null `Sku` | remove compiler warning without changing JSON |
| `Lamie.sln`, `Lamie.Tests/*` | added xUnit test project and four tests | make product contract regressions executable |

Success statuses remain 201 for create and 204 for update/delete. Existing DTO output and JSON casing are unchanged.

## 5. Database changes

- Synchronization task schema change: No.
- New migration from this task: No.
- Existing uncommitted migrations were present in the backend worktree before this task and were preserved.
- Rollback consideration: code changes can be reverted without a database rollback.
- EF migration model validation could not run because `dotnet-ef` is not installed on the machine.

## 6. Authentication and authorization

Verified:

- FE uses Bearer access tokens, a refresh token, one retry after 401 and numeric Admin/Manager/Staff roles.
- FE route guards and action visibility exist, including an Admin-only Users route.
- Backend registers no authentication scheme, does not call `UseAuthentication()` and has no `[Authorize]` attributes.
- Every current Product/Attribute backend endpoint is therefore public regardless of FE button visibility.

Changes made: none. Adding authorization without a token issuer/user store would immediately break all current clients and would invent security rules. This remains the highest-risk unresolved issue and requires the contract inputs listed in the plan.

## 7. Tests and commands

### Frontend

```text
Command: npm ci
Result: PASS
Relevant output: 212 packages installed; npm reported 2 High advisories.

Command: npm run typecheck
Result: PASS on final sequential run
Relevant output: tsc --noEmit completed with no errors.

Command: npm run build
Result: PASS on final sequential run
Relevant output: Vite transformed 1,950 modules; production assets generated without chunk warning.

Command: npm run lint
Result: NOT AVAILABLE
Relevant output: package.json has no lint script.

Command: npm test
Result: NOT AVAILABLE
Relevant output: package.json has no test script/test runner.

Command: npm audit --omit=dev
Result: FAIL security gate
Relevant output: 2 High findings from React Router RSC-mode advisory; automatic fix requires --force/breaking dependency change. The current application uses declarative BrowserRouter, not RSC actions.
```

One orchestration attempt ran `npm ci`, type-check and build concurrently. Type-check/build failed while `npm ci` was replacing `node_modules`. Both were rerun sequentially after install and passed; this was not a source-code failure.

### Backend

```text
Command: dotnet restore Lamie.sln
Result: PASS
Relevant output: all six projects restored/up-to-date.

Command: dotnet build Lamie.sln --no-restore
Result: PASS
Relevant output: 0 warnings, 0 errors.

Command: dotnet test Lamie.sln --no-restore --no-build
Result: PASS
Relevant output: 5 passed, 0 failed, 0 skipped.

Command: dotnet format Lamie.sln --verify-no-changes --no-restore --severity warn
Result: FAIL existing formatting gate
Relevant output: five whitespace diagnostics in ExceptionHandlingMiddleware.cs and ProductHandler.cs, neither changed by the synchronization implementation.

Command: dotnet ef migrations has-pending-model-changes --project Lamie.Infrastructure/Lamie.Infrastructure.csproj --startup-project Lamie.API/Lamie.API.csproj --no-build
Result: NOT AVAILABLE
Relevant output: dotnet-ef command/tool is not installed.

Command: git diff --check (both repositories)
Result: PASS
Relevant output: no whitespace errors; Git only warned about configured LF-to-CRLF conversion.
```

The first compile of the new test file failed because its xUnit namespace import was missing. The import was added, then solution build and all five tests passed. The tests cover domain collection synchronization, full update handler behavior with thumbnail upload/removal, legacy PUT preservation, validator failures and both Product PUT route templates.

A local HTTP smoke attempt was not executed because the environment rejected the background-process orchestration before starting the API. No runtime HTTP result is claimed.

## 8. Not completed

| Item | Reason | Risk | Completion path |
| --- | --- | --- | --- |
| Auth/JWT/refresh/logout API | no identity/token/schema contract | FE needs bypass to enter; backend remains public | define provider, token claims/expiry/revocation and persistence, then add integration tests |
| User API and role enforcement | no user entity/password/role policy | Users UI cannot run; no server authorization | define schema and policy matrix, implement behind authentication |
| Orders API | no order domain/schema/transitions | Orders, Dashboard and Customers are broken | approve state, payment, price, paging and timezone contracts, then implement incrementally |
| Channels API | no channel domain/id/reference policy | channel settings and order form lookup fail | define id type, uniqueness/deletion rules and authorization |
| Explicit per-file size/extension policy | repository documents no byte/format policy | MIME can be spoofed; server request limit is not a full image policy | approve formats/size/scanning, validate file signature and configure request limits |
| FE lint/unit/integration/E2E | no scripts or frameworks in current project | mapping/UI regressions rely on type/build and backend tests | add agreed ESLint and test stack as a separate foundation change |
| Database-backed API integration | LocalDB/seed/test fixture not documented | EF tracking and real HTTP/database behavior lack integration coverage | provide test database/fixture and add WebApplicationFactory tests |
| Migration model validation | dotnet-ef absent | existing migration/model drift cannot be proven | install/pin dotnet-ef matching EF Core 8, then rerun command |
| Format gate | pre-existing whitespace diagnostics | CI format verification may fail | format the two reported files in a dedicated cleanup change |

## 9. Breaking changes

No breaking API change was detected or introduced.

- Existing Product collection PUT remains available.
- New Product item PUT is additive.
- Existing response DTOs/statuses remain stable.
- Product validation is stricter only for requests already invalid under domain rules or outside FE's image-only behavior.

## 10. Remaining risks

- Critical security risk: backend admin endpoints are anonymous and CORS allows all origins.
- Critical functional gap: 25 active FE requirements have no backend endpoint.
- Business ambiguity: order transitions, customer identity/spend, timezone and pagination conventions are unconfirmed.
- File security: MIME-prefix validation is present, but signature scanning and explicit per-file size/extension limits are not defined.
- Test coverage: product unit/contract coverage exists; no database-backed controller integration or FE test runner exists.
- Environment: runtime smoke and migration drift validation remain unavailable.
- Worktree risk: both repositories contained extensive uncommitted changes before this task. Those changes were preserved, and the synchronization work should be reviewed/committed separately where possible.
