# Dynamic RBAC Inventory

Inventory date: 2026-08-04
Phase: PHASE 0 - Discovery and baseline

## Project boundaries

| Project | Path | Stack | Git branch | Scope |
| --- | --- | --- | --- | --- |
| FE | `D:\Git\Lamie\FE_Lamie` | React/Vite | `codex` | Read-only; clean baseline; no file may be changed |
| Admin | `D:\Git\Lamie\Admin_Lamie` | React 19, TypeScript 5.8, Vite 6, Tailwind 3, React Router 7, Playwright | `dev-codex` | Writable |
| API | `D:\Git\Lamie\API_Lamie` | ASP.NET Core 8, EF Core SQL Server, xUnit | `codex` | Writable |

The workspace root is not a Git repository. Admin, API, and FE are separate repositories. Documentation for this plan is stored under `Admin_Lamie/docs` so the workspace-root master plan and the read-only FE are not modified.

## Instructions and architecture documents read

Admin project-owned instructions read in full:

- `.agents/skills/design-taste-frontend/SKILL.md`
- `.agents/skills/full-output-enforcement/SKILL.md`
- `.agents/skills/gpt-taste/SKILL.md`
- `.agents/skills/minimalist-ui/SKILL.md`
- `.agents/skills/redesign-existing-projects/SKILL.md`
- `README.md`
- `CODEX_REFACTOR_RULES.md`
- `ADMIN_UI_REDESIGN.md`
- `FE_API_SYNC_AUDIT.md`
- `FE_API_SYNC_PLAN.md`
- `FE_API_SYNC_REPORT.md`
- `FINAL_REVIEW_REPORT.md`
- `PHASE_10_AUDIT.md`
- `PHASE_10_REPORT.md`

Workspace architecture/history documents read in full:

- `.codex/MASTER_ROADMAP.md`
- `.codex/docs/API_CONTRACT.md`
- `.codex/docs/DECISIONS.md`
- `.codex/docs/FINAL_REPORT.md`
- `.codex/docs/IMPLEMENTATION_PROGRESS.md`
- all phase pointer documents under `.codex/phases`

No `AGENTS.md` exists in Admin or API. API has no project-owned `SKILL.md`, `README.md`, or Markdown architecture/coding-rules document. The solution/project files, EF configuration, existing migrations, authorization configuration, identity services, and tests are therefore the authoritative API conventions.

## Existing user worktree baseline

Both writable repositories were dirty before this plan began. These changes belong to the user and must be preserved.

Admin tracked baseline changes:

- `.env`
- `src/app/router/AdminOnlyRoute.tsx`
- `src/app/router/AppRouter.tsx`
- `src/features/auth/context/AuthContext.tsx`
- `src/features/auth/permissions.ts`
- `src/features/auth/types.ts`
- settings and users files
- `src/shared/components/Sidebar.tsx`

Admin untracked baseline includes the complete `expenses`, `reports`, and `roles` features and their Playwright tests.

API tracked baseline changes include `Program.cs`, identity/JWT/bootstrap services, identity contracts/constants, `User`, `AppDbContext`, the EF snapshot, controllers, and tests. API untracked baseline includes the Expense, Report, Role/RBAC implementation, two migrations, and associated tests. No reset, checkout, or overwrite is permitted.

## Development database baseline

Read-only inventory was executed against the configured development database:

```text
Server: (localdb)\MSSQLLocalDB
Database: Lamie_Dev
Foreign-key constraints in database: 0
```

Current access-control row counts:

| Table | Rows |
| --- | ---: |
| `auth_users` | 3 |
| `auth_roles` | 3 |
| `auth_permissions` | 19 |
| `auth_user_roles` | 3 |
| `auth_role_permissions` | 42 |
| `auth_refresh_tokens` | 46 |

There is exactly one authoritative `auth_user_roles` row per current user. Current assignment distribution is two Admin users and one Staff user. The Manager role currently has no assigned user.

Important preservation baseline: source defaults describe 44 grants, while the development database currently contains 42 grants because grants have already been customized. Future seed/upsert logic must never reset an existing role to source defaults.

Current role grant counts:

| Role | System | Active | Grants |
| --- | --- | --- | ---: |
| `admin` | Yes | Yes | 19 |
| `manager` | Yes | Yes | 15 |
| `staff` | Yes | Yes | 8 |

The system currently uses no database foreign-key constraint. Logical references are protected in services and supported with indexes. Dynamic RBAC/navigation migrations must follow the same convention.

## The 19 existing permissions

| # | Code | Group |
| ---: | --- | --- |
| 1 | `products.view` | Sản phẩm |
| 2 | `products.manage` | Sản phẩm |
| 3 | `orders.view` | Đơn hàng |
| 4 | `orders.manage` | Đơn hàng |
| 5 | `orders.cancel` | Đơn hàng |
| 6 | `customers.view` | Khách hàng |
| 7 | `customers.manage` | Khách hàng |
| 8 | `channels.view` | Cấu hình |
| 9 | `channels.manage` | Cấu hình |
| 10 | `dashboard.view` | Báo cáo |
| 11 | `settings.view` | Cấu hình |
| 12 | `settings.manage` | Cấu hình |
| 13 | `expenses.view` | Tài chính |
| 14 | `expenses.manage` | Tài chính |
| 15 | `reports.view` | Báo cáo |
| 16 | `users.view` | Phân quyền |
| 17 | `users.manage` | Phân quyền |
| 18 | `roles.view` | Phân quyền |
| 19 | `roles.manage` | Phân quyền |

The code and IDs of these 19 rows are stable. They must be preserved exactly. The current table has only `id`, `code`, `name`, `group`, and `description`; PHASE 2 must add metadata columns additively.

## Current authorization architecture

- JWT access tokens contain the persisted role code and repeated `permission` claims.
- Permission resolution is database-backed through `auth_user_roles -> auth_role_permissions -> auth_permissions` in `IdentityService`.
- Refresh tokens are revoked when a user's role or a role's grants change. Existing access tokens can remain valid until their 15-minute expiry.
- `AuthorizationConfiguration` currently registers one static policy per entry in `PermissionNames.All`.
- API controllers use `[Authorize(Policy = PermissionNames.X)]`; API remains the authorization boundary.
- `PermissionNames` is currently both a compile-time constant catalog and the seed descriptor source.
- No permission/navigation cache exists in the current API.
- Admin uses `AuthUser.permissions` returned by the API, with a legacy numeric-role fallback for compatibility.

## Current permission schema and indexes

Current access-control tables:

- `auth_permissions`: GUID primary key; unique `code`; group/name index.
- `auth_roles`: GUID primary key; unique `code`; active/name index.
- `auth_user_roles`: composite primary key; unique user index; role index.
- `auth_role_permissions`: composite primary key; permission index.

No cascade delete or database FK is present. The database contains all repository migrations through `20260803135539_AddRolePermissionModel`, plus the documented legacy migration-history entry `20260731102859_AddOrderDeliveryAddressDescription`.

## Current hard-coded Sidebar inventory

`src/shared/components/Sidebar.tsx` currently owns two static business arrays and conditionally appends system links:

| Key | Label | Path | Permission | Group |
| --- | --- | --- | --- | --- |
| `dashboard` | Tổng quan | `/admin/dashboard` | `dashboard.view` | Main |
| `orders` | Đơn hàng | `/admin/orders` | `orders.view` | Main |
| `customers` | Khách hàng | `/admin/customers` | `customers.view` | Main |
| `calendar` | Lịch giao | `/admin/orders/calendar` | `orders.view` | Main |
| `expenses` | Chi phí | `/admin/expenses` | `expenses.view` | Main |
| `reports` | Báo cáo | `/admin/reports` | `reports.view` | Main |
| `settings-products` | Sản phẩm | `/admin/products` | `products.view` | Quản lý |
| `settings-channels` | Kênh bán | `/admin/settings/channels` | `channels.view` | Quản lý |
| `settings-attributes` | Thuộc tính | `/admin/settings/attributes/categories` | `settings.view` | Quản lý |
| `users` | Người dùng | `/admin/users` | `users.view` | Hệ thống |
| `roles` | Vai trò & quyền | `/admin/roles` | `roles.view` | Hệ thống |

The sidebar already supports permission filtering, active links, mobile close behavior, and accessibility. It does not support API data, hierarchy, icon fallback, disabled/hidden items, or load/error states.

## Current static Router inventory

Platform routes that should remain static:

- `/login`
- protected `/admin` root layout
- `/admin` index redirect/content behavior
- wildcard/not-found behavior

Current business routes that must receive Page Registry entries:

- `/admin/dashboard`
- `/admin/orders`
- `/admin/orders/new`
- `/admin/orders/calendar`
- `/admin/orders/:id`
- `/admin/orders/:id/edit`
- `/admin/customers`
- `/admin/customers/:id`
- `/admin/expenses`
- `/admin/settings/expense-categories`
- `/admin/reports`
- `/admin/settings/channels`
- `/admin/products`
- `/admin/products/create`
- `/admin/products/:id/edit`
- `/admin/settings/attributes/:attributeKey`
- `/admin/users`
- `/admin/users/new`
- `/admin/users/:id/edit`
- `/admin/roles`

Four legacy master-data paths currently redirect to settings attributes. They are compatibility routes, not navigation entries, and must remain available during migration.

Current routes are already lazy-loaded through `React.lazy`. Route guards exist only for Expenses, Reports, Users, and Roles route groups; several other business pages depend on API enforcement and UI action checks rather than a route-level permission guard. Dynamic route construction must add a consistent permission guard without removing API enforcement.

## Existing Admin management UI

- Roles page loads role rows and the permission catalog from `/api/roles` and `/api/roles/permissions`.
- It supports grouped permission selection, select-all by group, system-role protection, create/update/delete, assignment count, and grant count.
- It does not support permission CRUD/metadata, active/system indicators per permission, role menu preview, or navigation management.
- Users create/update supports persisted `roleId` while retaining the numeric role compatibility field.

## Build, test, lint, and type-check commands

Admin:

- Type-check: `npm run typecheck`
- Production build: `npm run build`
- Tests: `npm run test:e2e`
- Lint: unavailable; `npm run lint` reports a missing script

API:

- Restore: `dotnet restore Lamie.sln --nologo`
- Build: `dotnet build Lamie.sln --configuration Release --no-restore --nologo`
- Tests: `dotnet test Lamie.sln --configuration Release --no-restore --no-build --nologo`

## PHASE 0 baseline results

| Gate | Result |
| --- | --- |
| Admin type-check | PASS |
| Admin production build | PASS; 1,961 modules transformed |
| Admin Playwright | PASS; 16/16 |
| Admin lint | NOT AVAILABLE; no script/dependency |
| API restore | PASS |
| API Release build | PASS; 0 warnings, 0 errors |
| API xUnit | PASS; 100/100 |
| FE worktree | Clean and unchanged |

## PHASE 0 exit decision

The projects, instructions, current schema, 19 permissions, role/user/grant data, Sidebar, Router, and executable gates are fully inventoried. The baseline compiles and tests pass. PHASE 1 may proceed without changing PHASE 0 business code.
