# Dynamic RBAC Progress

## Current phase

PHASE 12 - Final review

## Status

Completed on 2026-08-04. All PHASE 0-12 exit criteria were reviewed and met, with the documented baseline exception that Admin has no lint script to execute. Security, data integrity, zero-FK architecture, migrations, cache invalidation, set-wise query behavior, route/permission conflicts, dead code, source markers, full Git scope, and FE read-only status were audited. Final Admin type-check/build/40 Playwright tests and API restore/Release build/108 tests pass. Required final and new-module documentation is complete.

## Skills read

- All five project-owned Admin skills under `.agents/skills` were read completely.
- Admin `README.md`, `CODEX_REFACTOR_RULES.md`, `ADMIN_UI_REDESIGN.md`, sync/audit/final-review documents, and prior phase documents were read completely.
- Workspace `.codex` architecture, decisions, contracts, progress, final report, and phase pointers were read completely.
- No Admin/API `AGENTS.md` exists.
- API has no project-owned `SKILL.md`, `README.md`, or Markdown coding-rules file.
- Instruction locations were rechecked before PHASE 1; no nearer/new instruction file appeared.

## Inventory changes

- Kept the original 19 permission codes and stable IDs unchanged.
- Added only `navigation.view` and `navigation.manage`; migration and startup synchronization grant new descriptors to Administrator without resetting Manager/Staff grants.
- Added metadata needed by dynamic management: system/active flags, sort order, and timestamps.
- Replaced static permission policy registration with a dynamic policy provider and a server-side active-role/active-permission resolver.
- Added logical navigation records that support group nodes, visible menu routes, and hidden route-only records without accepting external/unsafe paths.
- Added separate current-user menu-tree and accessible-route contracts so hidden routes never leak into Sidebar responses.
- Added Admin registry startup validation so invalid source metadata fails fast in development and conflicting production entries are skipped with sanitized one-time warnings.
- Added a fixed icon lookup and source lazy-component functions; database strings can never instantiate or import a component.
- Preserved platform routes (login, layout, index, redirects, fallback) outside business manifests while mapping every component-rendering business route.
- Preserved the concrete visible attributes URL and added a separate hidden parameter route mapped to the same source page definition.

## Assumptions

- `Lamie_Dev` is the only database eligible for development migration/testing.
- The current 42 RolePermission rows, not the 44 source defaults, are authoritative existing data.
- Documentation lives in `Admin_Lamie/docs` to respect the Admin/API-only modification boundary.
- JWT role/permission claims remain for compatibility, while API policy evaluation now resolves active permissions server-side with an in-memory cache.
- Permission management reuses `roles.view`/`roles.manage`; only navigation adds `navigation.view` and `navigation.manage`.

## Files changed

- Admin: `docs/DYNAMIC_RBAC_PROGRESS.md`.
- API domain/application: `Lamie.Domain/Entities/AccessControl.cs`, `Lamie.Application/Identity/Permissions.cs`, `Lamie.Application/Identity/PermissionManagementContracts.cs`.
- API persistence: `Lamie.Infrastructure/Persistence/AppDbContext.cs`, model snapshot, and `20260804031348_AddDynamicPermissionFoundation` migration/designer.
- API runtime: authorization provider/requirement/handler/configuration, `PermissionsController`, access-control cache, user permission resolver, permission service, descriptor synchronizer, audit writer, `IdentityService`, `RoleService`, and `Program.cs` registration.
- API tests: permission foundation, role-permission invalidation/audit, authorization contract, and migration-chain regression tests.
- PHASE 3 API: `Lamie.Application/Identity/NavigationContracts.cs`, `NavigationController`, `NavigationService`, navigation cache extensions, `AdminNavigation`, `AppDbContext`, `Program.cs`, `20260804032612_AddNavigationBackend` migration/designer, snapshot, navigation tests, and migration regression update.
- PHASE 4 Admin: `src/app/modules/{types,manifest,registry,iconRegistry,index}.ts`, `src/features/dashboard/manifest.ts`, registry startup import in `src/main.tsx`, navigation permission constants, `tests/e2e/registry.spec.ts`, and this progress file.
- PHASE 5 Admin manifests: `customers`, `expenses`, `orders`, `product`, `reports`, `roles`, `settings/attributes`, `settings/channels`, and `users`; dashboard manifest remains the tenth module. Registry coverage tests and this progress file were extended.
- PHASE 6 Admin: `src/features/navigation/{types/navigation.types,api/navigationApi,context/NavigationContext}.ts(x)`, `src/shared/components/Sidebar.tsx`, provider registration in `src/main.tsx`, widened dynamic permission typing in auth, `tests/e2e/navigation.spec.ts`, the navigation mock in `tests/e2e/orders.spec.ts`, and this progress file.
- PHASE 6 API: empty-container pruning in `NavigationService` and its regression assertion in `NavigationBackendTests`.
- PHASE 7 Admin: `src/app/router/dynamicRouteBuilder.ts`, the platform-only `AppRouter.tsx`, route state/fallback integration in `NavigationContext.tsx` and `navigationApi.ts`, dynamic route mocks in `orders.spec.ts`, `tests/e2e/dynamic-router.spec.ts`, and this progress file.
- PHASE 8 Admin: `src/features/access-control/{manifest,types,api,pages}`, navigation management API methods, Role page/types enhancements, registry test inventory, `tests/e2e/access-control.spec.ts`, Role regressions, route-loading race fix, and this progress file.
- PHASE 8 API: Role permission catalog DTO/projection now includes `IsSystem` and `IsActive`; Role integration coverage asserts those fields for the full descriptor catalog.
- PHASE 9 API persistence: `20260804041956_SeedDefaultAdminNavigation` migration/designer and migration-chain snapshot coverage.
- PHASE 9 API tests: insert-only/idempotent navigation seed migration regression in `NavigationBackendTests` and the 17-migration chain assertion in `IntegrationRegressionTests`.
- PHASE 10 API: serializable final-active-administrator protection in `IdentityService`; authorization/session/user-role integration coverage in Identity tests.
- PHASE 10 Admin: current-role permission/navigation refresh in `RolesManagementPage`, auth/session Playwright integration coverage, and navigation enable/disable UI regression.
- PHASE 11 Admin: removed runtime source-seed menu/route builders and fallback flags; simplified Sidebar/Router fail-closed states; deprecated the unused `AdminOnlyRoute`; marked legacy auth permission defaults compatibility-only; updated route mocks and cleanup regressions.
- PHASE 12 Admin documentation: `docs/DYNAMIC_RBAC_FINAL_REPORT.md`, `docs/ADDING_A_NEW_ADMIN_MODULE.md`, and this final progress update. No production code changed in PHASE 12.

## Database changes

Applied only to development `Lamie_Dev` after a verified copy-only backup. Before migration the database had 19 permissions, 3 roles, 42 grants, 3 exact user-role rows, 3 users, 0 FKs, and no `auth_navigation` table. After migration it has 21 permissions, 3 roles, 44 grants, the same 3 user-role rows/users, 25 navigation rows, and 0 FKs. Administrator changed from 19 to 21 grants; Manager remains 15 and Staff remains 8. The navigation inventory is 15 visible, 10 hidden, 23 route nodes, and 2 group nodes. Production was not connected to or modified.

## Migration

- Created `20260804031348_AddDynamicPermissionFoundation`.
- Adds permission metadata and `auth_access_audit` without any Foreign Key constraint.
- Existing/unknown permissions default active and retain their data; the original 19 rows are marked system/active with stable IDs.
- Navigation permission seeds are guarded by ID/code checks, never overwrite an existing row, and add missing Administrator grants only.
- Rollback deletes only matching new system descriptors after their grants, then removes the additive table/columns.
- Idempotent SQL generation succeeded; it contains no `FOREIGN KEY` creation.
- Created `20260804032612_AddNavigationBackend`, which adds `auth_navigation` and its logical-reference/tree/filter indexes without any FK constraint or seed mutation.
- Created `20260804041956_SeedDefaultAdminNavigation`, which inserts the exact 25 source navigation records with deterministic IDs only when both key and ID are available; an operator-owned matching key is retained unchanged.
- Seed parents are inserted before descendants; all page/component/icon references remain inert metadata resolved only through source registries.
- The seed rollback targets only matching deterministic ID/key pairs and retains a parent that has operator-owned children.
- Generated and reviewed an idempotent SQL script outside the repositories: no FK, `DROP TABLE`, or `TRUNCATE` statement was present in the PHASE 9 migration path.
- Created and verified a copy-only LocalDB backup at `C:\Users\Ngoph\AppData\Local\Temp\Lamie_Dev_PreDynamicRBAC_20260804_0420.bak` before applying anything.
- Applied all three RBAC migrations explicitly to `Lamie_Dev`; a second update reported that no migration was applied and all row counts stayed unchanged.
- PHASE 12 regenerated the three-migration idempotent forward script outside the repositories, verified no FK/destructive DDL/DML, deleted the temporary script, and re-verified the copy-only backup. No additional migration was applied.
- No migration was created or applied in PHASE 4.
- No migration was created or applied in PHASE 5.
- No migration was created or applied in PHASE 6.
- No migration was created or applied in PHASE 7.
- No migration was created or applied in PHASE 8.

## API changes

- Added permission list/search/group/system/active filters, paging, create, metadata update, and custom-permission deactivation endpoints under `/api/admin/permissions`.
- System permissions are immutable through management APIs; permission code is immutable after creation.
- Added database-backed policy resolution so stale permission claims cannot preserve revoked access.
- Added bounded in-memory authorization cache and explicit invalidation on permission, role, role-grant, and user-role changes.
- Added append-only access-control audit rows with sanitized before/after snapshots.
- Descriptor synchronization is insert-only for missing descriptors and never resets Manager/Staff grants.
- Added authenticated `/api/admin/navigation/me` and `/me/routes`, plus `navigation.view`/`navigation.manage` protected list/get/create/update/delete/reorder/enable/disable endpoints.
- Runtime queries resolve permissions and navigation set-wise, construct the tree in memory, skip inaccessible/disabled/hidden/orphan/cyclic records safely, and cache menu/routes per user.
- Management validation rejects unsafe or external paths, visible parameter routes, partial page bindings, immutable-key changes, missing logical references, self-parenting, cycles, negative/duplicate sibling order, system deletion, and deleting parents with children.
- Reorder runs in an explicit transaction; all mutations invalidate navigation caches and append sanitized audit snapshots.
- Current-menu construction now recursively prunes pathless containers that have no accessible descendants, so authorization cannot leave empty business groups in the Sidebar.
- No API source changed in PHASE 7; the existing current-user route contract was consumed as designed and the full API regression suite was rerun.
- Extended the Role permission lookup response additively with system/active metadata so Admin can warn about inactive grants and distinguish custom descriptors; existing fields and endpoints remain compatible.
- User disable/reassignment now checks the final active Administrator inside a serializable transaction, counts both persisted assignments and the legacy-role fallback, and allows the operation only when another active Administrator provides recovery.
- User-role updates continue to revoke refresh tokens, audit the assignment, and invalidate that user's authorization/menu/route cache; PHASE 10 integration coverage proves the new role is resolved immediately.

## Admin changes

- Added manifest types for modules, permissions, pages, and default navigation metadata.
- Added `import.meta.glob('/src/features/**/manifest.ts', { eager: true })` discovery with no central business-module import list.
- Added Module, Page, Permission Metadata, Default Navigation, and Icon registries with stable query APIs.
- Duplicate module/page/navigation keys and conflicting permission metadata are deterministic development errors; production keeps the first valid entry, skips conflicts, and records sanitized diagnostics.
- Added safe route/key/version/reference validation, visible-parameter protection, missing parent/page/permission checks, fixed-point orphan removal, and unknown-icon fallback warnings.
- Added a source-only named-export lazy adapter and dashboard manifest; current hard-coded Sidebar/Router remain intact during the planned transition.
- The Admin project-owned frontend skill guided the change toward audit-first incremental integration and reuse of the existing React/Vite/Lucide stack; no visual redesign was introduced in this infrastructure phase.
- Added manifests beside every existing business feature, with no changes to page/component business logic.
- Registered exactly 10 current modules and 20 pages matching the component-rendering routes in `AppRouter`.
- Registered all original 19 permissions as source metadata and 23 default navigation records: 11 visible linked items, 2 visible group containers, and 10 hidden route-only items.
- Group/navigation hierarchy reproduces the current main, management, and system Sidebar organization while keeping create/edit/detail/category/parameter routes hidden.
- `:attributeKey` camelCase compatibility is explicitly supported by the safe parameter validator; schemes, query/hash, traversal, backslash, control characters, and malformed parameters remain rejected.
- Added a typed current-navigation API client and authenticated `NavigationProvider` with request cancellation, stable retry, and source-manifest fallback restricted by the current user's permissions.
- Replaced Sidebar business arrays with recursive API-tree rendering; labels, ordering, nesting, visibility, and paths now come from the filtered navigation response.
- Sidebar resolves icon keys through the closed source Icon Registry, uses deterministic longest-path active matching, sanitizes all received paths, and never constructs a component from database content.
- Preserved the existing Lamie brand/user/logout shell and desktop/mobile close behavior while adding accessible loading, error/retry, and empty-navigation states.
- AppRouter remains on its transition implementation until PHASE 7.
- Added a deterministic dynamic route builder that accepts only safe internal Admin paths and registered source module/page pairs, rejects malformed payloads, disabled/missing modules, missing/mismatched pages, duplicate IDs/keys, exact/parameter-shape conflicts, and platform-route conflicts.
- Extended `NavigationProvider` with independently loaded current-user route state, retry, sanitized development diagnostics, and permission-filtered source-manifest fallback for transient API failures.
- Replaced every component-rendering business route/import in `AppRouter` with Page Registry lazy components; database data can select only an existing `moduleKey`/`pageKey`, never a filename, export, or component name.
- Added route guards that enforce the union of the immutable source page permission and the database navigation permission, so database metadata cannot weaken source authorization.
- Kept login, protected layout, unauthorized, not-found, loading/error, and legacy compatibility redirects static; `/admin` selects the first accessible dynamic route instead of hard-coding a business path.
- Added an `access-control` feature manifest for guarded `/admin/permissions` and `/admin/navigation` pages, adding only the two previously defined navigation descriptors and two system navigation seeds under the existing System group.
- Permission management supports server-side search/group/system/active filters, paging, role usage counts, custom creation, immutable code editing, custom reactivation/metadata update, safe deactivation, confirmation, refresh/invalidation, and full loading/empty/error/retry states. System descriptors are visibly protected.
- Navigation management supports a validated multi-level tree, create/edit, enable/disable, show/hide, parent selection with descendant exclusion, fixed Icon Registry selection, Page Registry binding, API permission selection, move up/down transactional reorder, protected deletion, Sidebar preview, and missing parent/page/permission/icon warnings.
- Role editor now searches/group-selects permissions, labels system/custom/inactive metadata, blocks saving inactive selections, and previews the role's visible menu using database navigation when authorized with source fallback otherwise.
- Fixed initial dynamic-route loading state so `/admin` cannot race to Not Found before the first current-route request starts.
- Role updates refresh the authenticated user and navigation only when the edited role is the current user's role, avoiding stale client authorization without remounting unrelated sessions/pages.
- Removed the temporary business-source fallback from `NavigationContext` and `dynamicRouteBuilder`; failed navigation APIs now expose only error/retry states and never synthesize business menu/routes from manifests at runtime.
- Kept Page/Icon Registry fallbacks required for safe missing-page/icon handling, and kept source default navigation only for registry metadata, the one-time migration snapshot, and management preview—not Sidebar/AppRouter runtime routing.
- Kept the well-known Admin permission constants for compile-time guards and a clearly isolated legacy-role compatibility fallback for older Auth responses; Permission/Role management screens use database APIs exclusively.

## Tests added

- Added dynamic policy provider coverage.
- Added permission controller contract coverage.
- Added disposable LocalDB coverage for all original 19 codes, metadata, no-FK schema, CRUD/filter/paging, uniqueness, system protection, immutable code, Administrator grant, resolver cache invalidation, audit, and synchronizer idempotency.
- Extended role tests to prove grant changes invalidate cached authorization and create audit records.
- Added navigation domain security tests, controller authorization/route contracts, and disposable LocalDB coverage for permission-filtered trees/routes, hidden routes, inactive/disabled rows, management warnings, CRUD protection, enable/disable cache invalidation, reorder, cycle rejection, audit actors, and zero FK constraints.
- Added 3 Playwright registry tests covering literal discovery, all duplicate/conflict classes, production conflict survival, diagnostics, and fixed source icon fallback.
- Extended registry Playwright coverage to lazy-load every source page and assert the exact 10-module/19-permission/20-page/23-navigation inventory, all current business paths, visible menu paths, hidden-route count, and zero diagnostics.
- Added 4 Sidebar Playwright regressions covering recursive permission-filtered rendering, API labels, fixed unknown-icon fallback, longest-path active state, omitted-item exclusion, loading/error/fail-closed retry, successful empty state, and mobile close behavior.
- Extended API navigation tests to prove inaccessible empty containers are pruned from the current-user menu tree.
- Added 7 dynamic-router Playwright regressions covering API-controlled safe paths with source-owned components, dynamic Admin index selection, source and navigation permission guards, missing-page fallback, deterministic reserved/exact/parameter conflict detection, and fail-closed API error/retry behavior.
- Added 5 access-control Playwright regressions covering permission filters/state/counts, custom create/update/deactivate, API error/retry, navigation missing-reference warnings/preview/reorder, and local validation plus registered-page creation.
- Extended Role Playwright coverage for permission search, inactive/custom indicators, save protection, and menu preview; added API integration assertions for Role permission system/active metadata.
- Added 3 Admin auth integration regressions for requested-path login, single-flight 401 refresh with access/refresh rotation and bearer retry, and failed-refresh session clearing/login recovery.
- Added API integration coverage for login/refresh rotation, persisted user-role update, immediate authorization/cache change, refresh-token revocation, UserRole audit, final-admin rejection, and two-admin recovery.
- Extended authorization coverage to assert unauthenticated challenge produces HTTP 401 and authenticated permission failure produces HTTP 403 with the configured bearer scheme.
- Extended navigation management UI coverage to exercise reorder, disable, and re-enable against refreshed API state.
- Updated Sidebar/Router regressions to prove API navigation failure no longer renders manifest-seed business items/routes and instead fails closed with scoped retry controls.
- Updated Role, Expense, and Report mocks to return explicit database-style current-user route records, preventing tests from depending on the removed compatibility fallback.

## Commands executed

PHASE 0:

- Git status for FE, Admin, and API.
- Full instruction/document discovery and reads.
- Read-only `sqlcmd` schema/data/index/migration inventory against `Lamie_Dev`.
- Admin type-check/build/Playwright/lint attempt.
- API restore/Release build/test.

PHASE 1:

- `npm run typecheck`
- `npm run build`
- `npm run test:e2e`
- `npm run lint`
- `dotnet build Lamie.sln --configuration Release --no-restore --nologo`
- `dotnet test Lamie.sln --configuration Release --no-restore --no-build --nologo`
- Git status/diff-stat/diff-name/diff-check review for Admin/API/FE.

PHASE 2:

- `dotnet build Lamie.sln -c Release`
- `dotnet test Lamie.sln -c Release --no-build`
- `dotnet tool run dotnet-ef migrations script --idempotent ... --no-build` (generated in memory only)
- `npm run typecheck`
- `npm run build`
- `npm run test:e2e`
- `npm run lint`
- Git status, tracked/untracked name review, numstat, diff-check, and FE read-only verification.

PHASE 3:

- `dotnet build Lamie.sln -c Release`
- `dotnet test Lamie.sln -c Release --no-build`
- `dotnet tool run dotnet-ef migrations add AddNavigationBackend ... --no-build`
- `dotnet tool run dotnet-ef migrations script --idempotent ... --no-build` (generated in memory only)
- `npm run typecheck`
- `npm run build`
- `npm run test:e2e`
- `npm run lint`
- Read-only `sqlcmd` preservation/migration-state query against `Lamie_Dev`.
- Git status, tracked/untracked/diff-stat/diff-check review, unsafe-code scan, migration review, and FE read-only verification.

PHASE 4:

- `npm run typecheck`
- `npm run build`
- `npm run test:e2e`
- `npm run lint`
- `npx playwright test tests/e2e/registry.spec.ts` during focused verification.
- `dotnet build Lamie.sln -c Release`
- `dotnet test Lamie.sln -c Release --no-build`
- Git status, tracked/untracked/diff-stat/diff-check review, registry safety scan, and FE read-only verification.

PHASE 5:

- `npm run typecheck`
- `npm run build`
- `npx playwright test tests/e2e/registry.spec.ts` (focused compatibility/coverage run)
- `npm run test:e2e`
- `npm run lint`
- `dotnet build Lamie.sln -c Release`
- `dotnet test Lamie.sln -c Release --no-build`
- Full manifest inventory, route/page/menu coverage review, Git status/diff-stat/diff-check, unsafe-code scan, and FE read-only verification.

PHASE 6:

- `npm run typecheck`
- `npm run build`
- `npx playwright test tests/e2e/navigation.spec.ts` (focused Sidebar verification)
- `npm run test:e2e`
- `npm run lint`
- `dotnet build Lamie.sln -c Release`
- `dotnet test Lamie.sln -c Release --no-build`
- Full Git status/diff-stat/diff-name/diff-check review, Sidebar unsafe/hard-coded-menu scan, and FE read-only verification.

PHASE 7:

- `npm run typecheck`
- `npm run build`
- `npx playwright test tests/e2e/dynamic-router.spec.ts tests/e2e/navigation.spec.ts` (focused route/Sidebar integration)
- `npx playwright test tests/e2e/orders.spec.ts` (focused legacy business-route regression)
- `npm run test:e2e`
- `npm run lint`
- `dotnet build Lamie.sln -c Release --no-restore --nologo`
- `dotnet test Lamie.sln -c Release --no-restore --no-build --nologo`
- Full Git status/diff-stat/diff-name/diff-check review, AppRouter business-import/path and unsafe-code scans, and FE read-only verification.

PHASE 8:

- `npm run typecheck`
- `npm run build`
- `npx playwright test tests/e2e/access-control.spec.ts tests/e2e/roles.spec.ts tests/e2e/registry.spec.ts` (focused management/registry/role run)
- `npx playwright test tests/e2e/dynamic-router.spec.ts -g "Admin index" --repeat-each=5` (route-load race stress regression)
- `npm run test:e2e`
- `npm run lint`
- `dotnet build Lamie.sln -c Release --no-restore --nologo`
- `dotnet test Lamie.sln -c Release --no-restore --no-build --nologo`
- Full Git status/diff-stat/diff-name/diff-check review, management unsafe-code/no-FK scan, and FE read-only verification.

PHASE 9:

- Read-only `sqlcmd` baseline and exact preservation queries against development `Lamie_Dev`.
- SQL Server `BACKUP DATABASE ... WITH COPY_ONLY` to a timestamped temp path and `RESTORE VERIFYONLY` validation.
- `dotnet tool run dotnet-ef migrations add SeedDefaultAdminNavigation ...`
- `dotnet tool run dotnet-ef migrations script --idempotent ...` to a temp path outside all repositories.
- Explicit `dotnet tool run dotnet-ef database update ... --connection <Lamie_Dev>`; repeated once to prove no-op/idempotency.
- Post-migration `sqlcmd` assertions for permission/role/grant/user/user-role/navigation/FK/migration counts, duplicate keys, orphan parents, duplicate sibling sort order, and dangling permission references.
- `npm run typecheck`
- `npm run build`
- `npm run test:e2e`
- `npm run lint`
- `dotnet build Lamie.sln -c Release --no-restore`
- `dotnet test Lamie.Tests/Lamie.Tests.csproj -c Release --no-build`
- Full Git status/diff-stat/diff-check review, complete seed migration review, unsafe/destructive SQL/conflict-marker scan, and FE read-only verification.

PHASE 10:

- `npx playwright test tests/e2e/auth-integration.spec.ts tests/e2e/roles.spec.ts` (focused login/refresh/current-role regression).
- `dotnet test ... --filter "FullyQualifiedName~Lamie.Tests.Identity"` (focused authorization/session/cache/recovery regression).
- `npm run typecheck`
- `npm run build`
- `npm run test:e2e`
- `npm run lint`
- `dotnet build Lamie.sln -c Release --no-restore`
- `dotnet test Lamie.Tests/Lamie.Tests.csproj -c Release --no-build`
- Read-only `Lamie_Dev` preservation/FK counts; full Git status/diff/diff-check, conflict, unsafe-code, secret-logging, Sidebar hard-code, Router hard-code, and targeted migration-FK scans.

PHASE 11:

- `rg` reference/inventory scans for Sidebar/AppRouter hard-code, `AdminOnlyRoute`, permission catalogs, duplicate seed/fallback functions, and unsafe component patterns.
- `npx playwright test tests/e2e/navigation.spec.ts tests/e2e/dynamic-router.spec.ts tests/e2e/roles.spec.ts` (focused cleanup/fail-closed route verification).
- `npx playwright test tests/e2e/expenses.spec.ts tests/e2e/reports.spec.ts` (focused explicit route-mock verification).
- `npm run typecheck`
- `npm run build`
- `npm run test:e2e`
- `npm run lint`
- `dotnet build Lamie.sln -c Release --no-restore`
- `dotnet test Lamie.Tests/Lamie.Tests.csproj -c Release --no-build`
- Read-only `Lamie_Dev` counts and full Git status/diff/diff-check/legacy/hard-code/unsafe-code scans with FE verification.

PHASE 12:

- Full source review for controller authorization, unsafe component/script patterns, secret logging, route/menu sources, registry/page/icon bindings, cache invalidation, set-wise query behavior, dead code, conflict markers, and work markers.
- Read-only `Lamie_Dev` exact descriptor/role/grant/user-role/navigation/FK/index/duplicate/orphan/dangling-reference checks.
- `RESTORE VERIFYONLY` for the pre-migration copy-only backup.
- `dotnet ef migrations list --configuration Release --no-build` against development.
- `dotnet ef migrations script 20260803135539_AddRolePermissionModel 20260804041956_SeedDefaultAdminNavigation --idempotent ...` to a temporary path, followed by forward-script safety scan and cleanup.
- `npm run typecheck`
- `npm run build`
- `npm run test:e2e`
- `npm run lint`
- `dotnet restore Lamie.sln --nologo`
- `dotnet build Lamie.sln -c Release --no-restore --nologo`
- `dotnet test Lamie.Tests/Lamie.Tests.csproj -c Release --no-build --nologo`
- Full Admin/API tracked and untracked scope, numstat, diff-check, static-source and safety scan; FE status/diff/untracked verification.

## Results

PHASE 12 final gates:

- Admin type-check: PASS.
- Admin build: PASS, 1,980 modules.
- Admin Playwright: PASS, 40/40.
- Admin lint: NOT AVAILABLE because no lint script exists.
- API restore: PASS, all projects up to date.
- API Release build: PASS, 0 warnings and 0 errors.
- API tests: PASS, 108/108.
- FE: clean and unchanged.

## Git diff review

- Pre-existing Admin/API modifications and untracked files remain preserved; no reset or overwrite was used.
- PHASE 12 changes are documentation-only: the final report, new-module guide, and this progress record. API production code did not change in this phase.
- `git diff --check` reports no whitespace errors in tracked Admin/API changes.
- Entire tracked/untracked file scope and migration script characteristics were reviewed.
- No FE diff exists.
- No reset, force-push, merge, deployment, or production migration occurred.
- Unsafe-code scan found no `eval`, dynamic `Function`, or remote script pattern in API source/tests.
- Admin registry review confirmed the only component loaders are source-owned lazy functions, icon lookup is a closed source map with a stable fallback, and discovery uses the required literal glob.
- AppRouter scan confirmed no business page import, component route, `AdminOnlyRoute`, or business default-path constant remains. Only platform routes and explicit legacy compatibility redirects remain static.
- Dynamic route review confirmed malformed API data is non-fatal, Page Registry is the sole component resolver, source permissions cannot be weakened by database metadata, and route conflicts are deterministic.
- Management review confirmed navigation forms select components/pages/icons only from closed source registries, force internal-tab behavior, reject incomplete/unsafe bindings, and never execute database strings.
- Permission management performs deactivation instead of hard delete and keeps system descriptors immutable; Role UI retains existing grants until an authorized user explicitly changes them.
- The PHASE 9 SQL review found no FK creation, destructive table operation, unguarded seed overwrite, duplicate key, orphan parent, duplicate sibling order, or dangling permission reference.
- `Lamie_Dev` preservation assertions prove all original 19 permission IDs/codes and all original 42 grants remain; only the two planned navigation descriptors and two Administrator grants were added.
- PHASE 10's final read-only query confirms `Lamie_Dev` remains 21 permissions/3 roles/44 grants/3 user-role rows/3 users/25 navigation rows/0 FKs with role totals Admin 21, Manager 15, Staff 8.
- Targeted scans found no FK operation in the three RBAC migration source files, no secret/token logging, no unsafe component construction, and no reintroduced Sidebar menu or AppRouter business-route arrays. The only inline script match is the pre-existing, local printable-report `window.print()` document; it is neither remote nor database-controlled.
- PHASE 11 scans found no `buildSourceFallback`, `buildSourceRouteRecords`, fallback-state flags, synthesized `source:` route/menu IDs, Sidebar business array, AppRouter business component route, unsafe component resolver, or `AdminOnlyRoute` consumer.
- The user-modified `AdminOnlyRoute` file was not deleted or reset; its permission prop enhancement remains, it is marked deprecated, and its only denial redirect now targets the static `/admin/unauthorized` platform route.
- PHASE 12 final scope review covered every tracked diff path and every untracked Admin/API file, rechecked all generated migration characteristics, and found no whitespace error, conflict marker, unsafe runtime component source, unguarded business endpoint, Sidebar business source, or AppRouter business component route.
- Final database audit found exact matches for all 21 deterministic descriptor ID/code pairs, all 21 system permissions active, 44 grants, 3 user-role rows, 25 navigation rows, no duplicate route path, and 0 FKs. Earlier preservation comparison retains proof that the original 19 permissions and 42 grants were not removed or rewritten.

## Risks

- Admin has no lint script.
- Existing access tokens may remain authenticated until expiry, but the server-side permission handler makes grant revocation effective without waiting for token claims to expire.
- The dirty user baseline overlaps the auth/router/sidebar files required by later phases; all edits must remain incremental.
- The database intentionally has no FK constraints, so all new logical references require indexes and service validation.
- Startup descriptor/navigation synchronization must remain insert-only for existing rows or it could overwrite operator metadata/grants; current implementation enforces insert-only descriptor behavior.
- The verified development backup is intentionally outside the repositories and should be retained until the final validation window is accepted.
- The cache is process-local. A future horizontally scaled deployment must add distributed caching or cross-instance invalidation before relying on immediate revocation across every instance.

## Remaining work

None. PHASE 0 through PHASE 12 are complete.

## Next phase

None.

## Phase history

### PHASE 0 - Discovery and baseline

- Identified `FE_Lamie`, `Admin_Lamie`, and `API_Lamie`; FE was marked read-only and remained clean.
- Read all applicable skills, rules, README, architecture, audit, contract, and prior implementation documents.
- Inventoried 19 permissions, 3 roles, 42 grants, 3 exact user-role rows, 0 foreign keys, Sidebar items, business routes, auth flow, and executable commands.
- Baseline passed Admin type-check/build/16 Playwright tests and API restore/build/100 tests. Admin lint was unavailable.
- Created `docs/DYNAMIC_RBAC_INVENTORY.md` and this progress file.
- Exit criteria met.

### PHASE 1 - Detailed design

- Created `docs/DYNAMIC_RBAC_DESIGN.md`.
- Defined additive schema, source descriptor synchronization, dynamic policy provider/handler, server-side permission cache, explicit invalidation, audit records, permission/navigation APIs, Vite manifest discovery, Page/Icon registries, dynamic menu/routes, migration mapping, security, performance, tests, and rollback.
- Preserved API constants and JWT claims for backward compatibility while defining database-backed authorization as the runtime source.
- Defined visible menu and hidden route records without weakening the current-user menu contract.
- Re-ran all available gates and reviewed Git scope/diff.
- Exit criteria met.

### PHASE 2 - Permission foundation

- Extended permission persistence additively while preserving all 19 original descriptors, stable identifiers, users, roles, user-role rows, and current grants.
- Added permission management endpoints, dynamic database-backed authorization, active permission filtering, bounded caching, explicit invalidation, and access-control audit.
- Added guarded/idempotent descriptor synchronization and a no-FK migration; the migration was generated and scripted but not applied to `Lamie_Dev` or production.
- Passed API Release build with 0 warnings/errors and 103/103 tests; Admin type-check/build/16 Playwright tests passed, while lint remains unavailable because the project has no lint script.
- Reviewed migration SQL, complete Git scope, whitespace, and FE status; FE remains clean and unchanged.
- Exit criteria met.

### PHASE 3 - Navigation backend

- Added the foreign-key-free `auth_navigation` model/migration with all designed logical-reference and query indexes.
- Added strict internal path, route binding, parent, cycle, sibling-order, system-record, and delete validation.
- Added authenticated current-user visible tree and hidden-capable route endpoints, protected management CRUD/state/reorder APIs, per-user caching, deterministic invalidation, and Navigation audit records.
- Passed API Release build with 0 warnings/errors and 106/106 tests; Admin type-check/build/16 Playwright tests passed, while lint remains unavailable because no script exists.
- Verified idempotent SQL contains no Foreign Key creation and read-only `Lamie_Dev` counts remain exactly 19 permissions/42 grants/3 user-role rows/0 FKs with no PHASE 2-3 migration applied.
- Reviewed complete Git scope, whitespace, unsafe-code scan, migrations, and FE status; FE remains clean and unchanged.
- Exit criteria met.

### PHASE 4 - Admin manifest and registries

- Added typed module/page/permission/navigation manifests and literal Vite auto-discovery that initializes at Admin startup.
- Built Module, Page, Permission Metadata, Default Navigation, and fixed Lucide Icon registries with deterministic development errors and resilient production conflict handling.
- Added strict metadata/path/reference checks, sanitized diagnostics, stable unknown-icon fallback, and no dynamic component construction from database content.
- Added the dashboard adapter/manifest without changing its business logic and retained the current Sidebar/Router transition path.
- Passed Admin type-check/build/19 Playwright tests; lint remains unavailable because no script exists. API Release build and 106/106 tests remained green.
- Reviewed complete Git scope, registry safety patterns, whitespace, and FE status; FE remains clean and unchanged.
- Exit criteria met.

### PHASE 5 - Migrate existing modules

- Added feature-owned manifests for every current business module without changing page business logic.
- Registered 10 modules, all original 19 permission metadata records, 20 lazy page definitions, 11 visible menu links, 2 group containers, and 10 hidden business routes.
- Covered every existing business route, including create/edit/detail pages and the concrete/parameterized attributes pair; platform redirects remain static by design.
- Focused registry tests caught and resolved camelCase `:attributeKey` compatibility while retaining strict path safety.
- Passed Admin type-check/build/20 Playwright tests; lint remains unavailable because no script exists. API Release build and 106/106 tests remained green.
- Reviewed complete manifest/route/menu inventory, Git scope, unsafe patterns, whitespace, and FE status; FE remains clean and unchanged.
- Exit criteria met.

### PHASE 6 - Dynamic Sidebar

- Added the authenticated navigation provider and a typed current-menu API boundary with source-manifest fallback for transient API unavailability.
- Removed all hard-coded business navigation arrays from Sidebar and rendered the permission-filtered hierarchy recursively with API-owned labels/order/visibility.
- Kept icon/component resolution source-controlled, added safe path filtering, deterministic active-route matching, and explicit loading/error/retry/empty UI.
- Pruned empty inaccessible containers server-side so permission filtering cannot expose empty groups.
- Passed Admin type-check/build/24 Playwright tests; lint remains unavailable because no script exists. API Release build passed with 0 warnings/errors and 106/106 tests passed.
- Reviewed complete Git scope, whitespace, hard-coded-menu/unsafe patterns, and FE status; FE remains clean and unchanged.
- Exit criteria met.

### PHASE 7 - Dynamic Router

- Added safe dynamic route construction from the current-user route API and source Page Registry, with runtime payload validation and deterministic conflict handling.
- Removed all component-rendering business imports/routes and the business default route from AppRouter while retaining platform and compatibility routes.
- Enforced both source-page and navigation permissions at route render time; missing modules/pages and unsafe/conflicting records fail closed without crashing Admin.
- Added explicit loading, unavailable/retry, unauthorized, and not-found states plus permission-filtered source fallback for API outages.
- Passed Admin type-check/build/31 Playwright tests; lint remains unavailable because no script exists. API Release build passed with 0 warnings/errors and 106/106 tests passed.
- Reviewed complete Git scope, whitespace, AppRouter business-route/unsafe patterns, and FE status; FE remains clean and unchanged.
- Exit criteria met.

### PHASE 8 - Management pages

- Added guarded Permission and Navigation management pages backed by the PHASE 2-3 APIs, with complete filters/CRUD/state/reorder/validation/loading/empty/error interactions.
- Bound navigation only to source Page/Icon registries and API permission data, with preview and missing-reference diagnostics; no database string can select a component.
- Enhanced Role permission editing with search, grouping, system/custom/inactive indicators, inactive-save protection, and database-first role menu preview.
- Expanded the manifest registry to 11 modules, 21 permissions, 22 pages, and 25 navigation seeds without altering the original 19 permission descriptors.
- Passed Admin type-check/build/37 Playwright tests; lint remains unavailable because no script exists. API Release build passed with 0 warnings/errors and 106/106 tests passed.
- Reviewed complete Git scope, whitespace, unsafe patterns, no-FK boundary, and FE status; FE remains clean and unchanged.
- Exit criteria met.

### PHASE 9 - Existing data migration

- Captured exact pre-migration development counts and assignments, then created and verified a copy-only `Lamie_Dev` backup before any database mutation.
- Added an insert-only/idempotent seed migration for all 25 source navigation records with deterministic IDs, guarded keys/IDs, parent-first ordering, and no FK constraint.
- Applied the three reviewed RBAC migrations only to `Lamie_Dev`; production was not connected to or migrated, and a repeat update was a no-op.
- Preserved all original 19 permission rows, 42 grants, 3 roles, 3 users, and 3 exact user-role assignments; added only 2 navigation permissions, 2 Administrator grants, and 25 navigation records.
- Verified 0 FKs, no duplicate navigation key/sibling order, no orphan parent, no dangling permission reference, and a valid 15-visible/10-hidden/23-route/2-group inventory.
- Passed Admin type-check/build/37 Playwright tests; lint remains unavailable because no script exists. API Release build passed with 0 warnings/errors and 107/107 tests passed.
- Reviewed complete Git scope, migration SQL, whitespace, unsafe/destructive patterns, and FE status; FE remains clean and unchanged.
- Exit criteria met.

### PHASE 10 - Integration regression

- Verified login, JWT permission claims, server-side permission resolution, refresh rotation/failure, role and user-role updates, current-role client refresh, cache invalidation, and explicit 401/403 behavior.
- Added a serializable guard that prevents disabling or reassigning the final active Administrator while retaining legacy-role fallback and allowing safe recovery when another active Administrator exists.
- Re-ran Sidebar, dynamic route, permission, role, missing page/icon, navigation CRUD/reorder/enable/disable, refresh/error, and legacy business-flow regressions.
- Passed Admin type-check/build/40 Playwright tests; lint remains unavailable because no script exists. API Release build passed with 0 warnings/errors and 108/108 tests passed.
- Confirmed development counts remain unchanged from PHASE 9, zero FKs remain, FE is clean, and no unsafe/dynamic component or business hard-code pattern was introduced.
- Reviewed complete Git scope, phase diff, whitespace, conflict markers, security patterns, and preservation evidence.
- Exit criteria met.

### PHASE 11 - Remove legacy sources

- Removed manifest-derived runtime business menu and route fallback builders after integration regressions passed; database navigation endpoints are now the sole runtime business configuration source.
- Preserved loading, explicit API error/retry, empty navigation, missing page, Not Found, Unauthorized, and fixed icon fallbacks while failing closed on navigation API failure.
- Confirmed Sidebar and AppRouter contain no business arrays/imports/component routes; default navigation seeds are no longer consumed by runtime Sidebar/Router code.
- Preserved the dirty user baseline in `AdminOnlyRoute` by deprecating rather than deleting it, retained its generic permission enhancement, and removed its dashboard redirect. Marked Admin legacy-role defaults compatibility-only and not a UI catalog.
- Updated all E2E mocks that had implicitly depended on the temporary source fallback to provide the API current-route contract explicitly.
- Passed Admin type-check/build/40 Playwright tests; lint remains unavailable because no script exists. API Release build passed with 0 warnings/errors and 108/108 tests passed.
- Confirmed `Lamie_Dev` remains 21 permissions/44 grants/3 user-role rows/25 navigation rows/0 FKs, FE remains clean, and full cleanup/diff/unsafe scans are clean.
- Exit criteria met.

### PHASE 12 - Final review

- Audited security, data integrity, zero-FK schema, migrations, cache/invalidation, N+1 behavior, route/permission conflicts, dead code, source markers, and complete Git scope.
- Verified only Auth login/refresh are anonymous; all management/business boundaries retain authenticated permission policies and explicit `401`/`403` coverage.
- Regenerated the idempotent RBAC migration path and found no FK or destructive forward operation; re-verified the development backup and removed the temporary script.
- Reconfirmed `Lamie_Dev` has exact 21 descriptor IDs/codes, 44 grants, 3 user-role rows, 25 navigation rows, no duplicate route and 0 FKs, with all original preservation evidence intact.
- Passed Admin type-check/build/40 Playwright tests. Admin lint was attempted and remains unavailable because the project has no lint script.
- Passed API restore, Release build with 0 warnings/errors, and 108/108 tests.
- Confirmed FE is clean and read-only; no deploy, production migration, merge, reset, force-push, or data deletion occurred.
- Created `DYNAMIC_RBAC_FINAL_REPORT.md` and `ADDING_A_NEW_ADMIN_MODULE.md`; exit criteria met.

## Post-plan rollout history

### 2026-08-05 - Local `Lamie` database

- Identified the explicit target as `(localdb)\MSSQLLocalDB / Lamie`, distinct from `Lamie_Dev` and from production.
- Captured the pre-migration table/migration/data baseline, created a copy-only backup, and verified the backup before applying schema.
- Built Release successfully and generated/reviewed an idempotent forward script for the five missing migrations; no FK or destructive forward operation was present.
- Applied the reviewed script and reran it successfully as a no-op.
- Verified 21 exact permissions, 3 roles, 46 grants, 3 matching user-role assignments, 25 navigation rows, 0 FKs, no logical-reference conflict, preserved user/business row counts, and no pending source migration.
- Passed API regression 108/108; no source/config file was changed by the database operation.
