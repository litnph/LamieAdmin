# Dynamic RBAC and Navigation Design

Design date: 2026-08-04
Phase: PHASE 1 - Detailed design

## Goals and invariants

This design makes the database authoritative for permission metadata, role grants, user-role assignments, and navigation metadata while keeping executable React components and API authorization descriptors in source control.

The following invariants are non-negotiable:

1. Preserve the current 19 permission rows and their stable codes/IDs.
2. Preserve all existing Role, RolePermission, UserRole, User, login, refresh-token, and JWT behavior.
3. Treat the current 42 development RolePermission rows as operator data. Never reset them to the 44 source defaults.
4. Keep the legacy numeric `auth_users.role` value for compatibility; `auth_user_roles` remains authoritative.
5. Add no database foreign-key constraint. Every reference is logical, indexed, and validated in services.
6. Never execute JavaScript, component names, file names, URLs, or scripts from the database.
7. Resolve a database `pageKey` only through the source-owned Page Registry.
8. Keep API authorization as the final security boundary.
9. Do not deploy or run a production migration.

## Target data model

### Extended `auth_permissions`

Existing columns remain unchanged and receive additive metadata:

| Column | Type | Rule |
| --- | --- | --- |
| `id` | `uniqueidentifier` | Existing stable ID or new generated/stable descriptor ID |
| `code` | `nvarchar(120)` | Unique, normalized lowercase, immutable after creation |
| `name` | `nvarchar(160)` | Required |
| `description` | `nvarchar(500)` | Nullable |
| `group` | `nvarchar(120)` | Required |
| `is_system` | `bit` | Existing/source descriptor rows are true |
| `is_active` | `bit` | Active permissions participate in resolution |
| `sort_order` | `int` | Non-negative |
| `created_at` | `datetime2` | UTC |
| `updated_at` | `datetime2` | UTC |

Indexes:

- Existing unique index on `code` remains.
- Replace/extend the catalog ordering index with `(is_active, group, sort_order, name)` if generated SQL is safe.
- Existing RolePermission permission index remains.

Rules:

- System permissions cannot be deleted, disabled, or have their code changed.
- Custom permission code is also immutable because navigation stores a logical code reference.
- Custom permission metadata and active state can be updated.
- `DELETE` is a safe deactivate operation for a custom permission. It never hard-deletes a referenced row.
- An inactive permission remains in grants for data preservation but is excluded from effective permission resolution and is shown as inactive in Admin.
- A custom permission cannot protect an API endpoint merely by existing in the database. Endpoint protection still requires a source-owned descriptor/constant and an authorization attribute.

### New system permission descriptors

The original 19 descriptors remain unchanged. Add exactly these source-owned descriptors:

| Code | Purpose |
| --- | --- |
| `navigation.view` | View navigation configuration |
| `navigation.manage` | Create, update, reorder, enable, disable, and hide navigation |

Only the system administrator role receives new system descriptors automatically. Existing Manager/Staff grants are not reset or expanded. Creating a custom permission also grants it to the system administrator to preserve recovery access.

Permission management itself reuses `roles.view` for reads and `roles.manage` for mutations. This avoids adding redundant permission-management codes while keeping the existing role-management boundary.

### New `auth_navigation`

| Column | Type | Rule |
| --- | --- | --- |
| `id` | `uniqueidentifier` | Primary key |
| `key` | `nvarchar(120)` | Unique, normalized stable key |
| `parent_id` | `uniqueidentifier` | Nullable logical self-reference; no FK |
| `module_key` | `nvarchar(120)` | Nullable for group/container records |
| `page_key` | `nvarchar(160)` | Nullable for group/container records |
| `label` | `nvarchar(160)` | Required |
| `description` | `nvarchar(500)` | Nullable |
| `path` | `nvarchar(400)` | Nullable for group/container records |
| `icon_key` | `nvarchar(80)` | Nullable; resolved only by Icon Registry |
| `permission_code` | `nvarchar(120)` | Nullable logical reference; no FK |
| `sort_order` | `int` | Non-negative |
| `is_visible` | `bit` | Controls Sidebar only |
| `is_enabled` | `bit` | Controls both menu and route availability |
| `is_system` | `bit` | System records cannot be hard-deleted |
| `open_in_new_tab` | `bit` | False for internal business pages |
| `created_at` | `datetime2` | UTC |
| `updated_at` | `datetime2` | UTC |
| `created_by` | `uniqueidentifier` | Nullable logical user reference; no FK |
| `updated_by` | `uniqueidentifier` | Nullable logical user reference; no FK |

Indexes:

- Unique `key`.
- `(parent_id, sort_order, label)` for deterministic tree construction.
- `permission_code` for access filtering.
- `(module_key, page_key)` for registry diagnostics and route lookup.
- `(is_enabled, is_visible)` for current-user menu queries.

Rules:

- Internal path starts with `/admin/` and contains no scheme, protocol-relative prefix, control character, query string, hash, backslash, or traversal segment.
- A visible path cannot contain route parameters. Route-only hidden records may use validated `:parameter` segments.
- Parent cannot equal the item and cannot create a cycle.
- Parent must exist when supplied.
- Permission code must exist when supplied. Inactive permission is retained but produces a management warning and no accessible result.
- `moduleKey`, `pageKey`, `iconKey`, and key use bounded identifier syntax. API validates syntax; Admin validates registry existence.
- System records and parent records with children cannot be hard-deleted.
- Reorder/move operations run in an explicit transaction and validate the complete resulting tree before save.

### New `auth_access_audit`

An append-only audit table records Role, Permission, UserRole, RolePermission, and Navigation mutations:

| Column | Type | Rule |
| --- | --- | --- |
| `id` | `uniqueidentifier` | Primary key |
| `occurred_at` | `datetime2` | UTC |
| `actor_user_id` | `uniqueidentifier` | Nullable logical reference; no FK |
| `action` | `nvarchar(80)` | Create, update, deactivate, delete, assign, reorder, enable, disable |
| `entity_type` | `nvarchar(80)` | Role, Permission, UserRole, RolePermission, Navigation |
| `entity_id` | `nvarchar(160)` | String representation of affected logical identity |
| `before_json` | `nvarchar(max)` | Nullable sanitized metadata snapshot |
| `after_json` | `nvarchar(max)` | Nullable sanitized metadata snapshot |

Audit JSON never contains JWTs, refresh tokens, passwords, password hashes, connection strings, or secrets. Index `(entity_type, entity_id, occurred_at)` and `actor_user_id, occurred_at`. No FK is created.

## Permission descriptor synchronization

`PermissionNames` remains the compile-time source of endpoint constants. A descriptor registry supplies stable ID, code, default name, default group, description, and sort order.

At startup in a scoped initializer:

1. Read all permission codes in one query.
2. Insert missing source descriptors only.
3. Mark the original 19 and new navigation descriptors as system permissions during migration.
4. Do not delete unknown/custom permissions.
5. Do not overwrite operator-edited rows during routine startup.
6. Ensure the system administrator has a grant for every newly inserted permission.
7. Never recreate Manager/Staff default grants after their role already exists.

This makes startup idempotent and prevents the 42 current grants from being reset to source defaults.

## Dynamic authorization

Replace the loop that statically registers every policy with:

- `PermissionRequirement`
- `PermissionAuthorizationHandler`
- custom `IAuthorizationPolicyProvider`
- `IUserPermissionResolver`
- `IAccessControlCache`

The policy provider creates a policy for a valid normalized permission policy name without requiring a manual `Program.cs` entry. The handler extracts the authenticated user ID, resolves active permissions server-side, and succeeds only when the required code is present.

JWTs continue to carry role and permission claims for client/backward compatibility, but API authorization no longer trusts a potentially stale permission claim as its only source. Login, refresh, and `/auth/me` keep their existing contracts.

Unknown or inactive policies fail closed. A typo in an authorization attribute cannot grant access.

## Cache and invalidation

Use in-process `IMemoryCache`; do not add Redis.

Cache entries:

- Effective active permission codes by user ID.
- Visible current-user navigation tree by user ID.
- Accessible current-user route records by user ID.

Invalidation:

| Mutation | Invalidation |
| --- | --- |
| Permission create/update/deactivate | All effective-permission and navigation entries |
| RolePermission change | Affected role's users; revoke their active refresh tokens |
| UserRole change | Affected user; revoke that user's active refresh tokens |
| Navigation create/update/delete/reorder/enable/disable/show/hide | All navigation/route entries |
| New source descriptor sync | Administrator permission/navigation entries |

The cache abstraction tracks its own keys so invalidation is deterministic. Cache failures fall back to database resolution; they never bypass authorization.

Admin owns a `NavigationProvider` or equivalent query context. Permission/navigation/role/user-role mutations call `refreshUser()` and invalidate/reload the current navigation state. No navigation data is stored in JWTs.

## API contracts

Existing response envelope and camelCase JSON conventions remain.

### Permission management

```http
GET    /api/admin/permissions
GET    /api/admin/permissions/{id}
POST   /api/admin/permissions
PUT    /api/admin/permissions/{id}
DELETE /api/admin/permissions/{id}
```

Read permission: `roles.view`. Mutation permission: `roles.manage`.

List query supports `search`, `group`, `system`, `active`, `page`, and `pageSize`. The response includes metadata plus `roleCount`. Page size is bounded to 100.

Create accepts code, name, description, group, active, and sort order. Update accepts metadata and active state but not a new code. System rows reject mutation/deletion. Delete safely deactivates a custom permission and rejects a system permission.

### Current-user navigation

```http
GET /api/admin/navigation/me
GET /api/admin/navigation/me/routes
```

Both require authentication. The server resolves active permissions in one set-based operation and loads navigation in one set-based operation.

`/me` returns a deterministic visible tree. It includes only enabled, visible, permission-accessible records and necessary accessible group ancestors. Invalid/orphaned records are skipped without failing the whole endpoint.

`/me/routes` returns a flat list of enabled, permission-accessible records that contain path, module key, and page key. It includes route-only hidden records so create/edit/detail pages can be built dynamically while remaining absent from the Sidebar.

This split is required because the master contract correctly says the menu endpoint must not return hidden entries, while the router still needs hidden business routes.

### Navigation management

```http
GET    /api/admin/navigation
GET    /api/admin/navigation/{id}
POST   /api/admin/navigation
PUT    /api/admin/navigation/{id}
DELETE /api/admin/navigation/{id}
POST   /api/admin/navigation/reorder
POST   /api/admin/navigation/{id}/enable
POST   /api/admin/navigation/{id}/disable
```

Read permission: `navigation.view`. Mutation permission: `navigation.manage`.

Management responses are flat records with parent IDs so Admin can edit/reorder without losing invalid/orphan diagnostics. Delete is rejected for system items and parents with children. Enable/disable are explicit idempotent operations.

Reorder request contains the intended item IDs, parent IDs, and sort orders for the changed sibling sets. The API rejects duplicate IDs, missing parents, cycles, negative order, and attempts to move an item below itself.

## Admin module manifest contract

```ts
export interface AdminModuleManifest {
  moduleKey: string;
  displayName: string;
  version: string;
  enabled?: boolean;
  permissions: PermissionMetadata[];
  pages: AdminPageDefinition[];
  defaultNavigation?: NavigationSeed[];
}

export interface AdminPageDefinition {
  pageKey: string;
  defaultPath: string;
  requiredPermission?: string;
  lazyComponent: () => Promise<{ default: React.ComponentType }>;
}
```

`NavigationSeed` contains a stable key, optional parent key, label, default path, icon key, module/page key, permission code, sort order, visibility, enabled state, and system state. It contains metadata only, never executable code.

Manifest discovery uses Vite's literal glob:

```ts
import.meta.glob('/src/features/**/manifest.ts', { eager: true })
```

Every manifest exports a consistently named `manifest`. Discovery builds:

- Module Registry
- Page Registry
- Permission Metadata Registry
- Default Navigation Registry

Duplicate module keys, page keys, permission codes with conflicting metadata, and default navigation keys are deterministic errors in development. Production skips an invalid conflicting entry, logs one sanitized warning, and keeps the application usable.

Registry APIs:

- `getPageDefinition(pageKey)`
- `getModuleDefinition(moduleKey)`
- `getAllPageDefinitions()`
- `getAllModuleDefinitions()`

No central hard-coded module import list is created.

## Existing module mapping

Adapters/manifests will be added without changing page business logic:

| Module key | Representative page keys |
| --- | --- |
| `dashboard` | `dashboard.home` |
| `orders` | `orders.list`, `orders.create`, `orders.calendar`, `orders.detail`, `orders.edit` |
| `customers` | `customers.list`, `customers.detail` |
| `expenses` | `expenses.list`, `expenses.categories` |
| `reports` | `reports.financial` |
| `products` | `products.list`, `products.create`, `products.edit` |
| `settings-channels` | `settings.channels` |
| `settings-attributes` | `settings.attributes` |
| `users` | `users.list`, `users.create`, `users.edit` |
| `roles` | `roles.list` |
| `permissions` | `permissions.list` |
| `navigation` | `navigation.list` |

Login, unauthorized, not-found, root layout, and compatibility redirects are platform routes and do not belong to a business manifest.

## Dynamic route construction

The root router keeps static platform routes and renders one dynamic route host below the protected Admin layout.

Flow:

```text
Authenticate current user
-> resolve current user permissions
-> load /api/admin/navigation/me/routes
-> validate module/page/path against registries
-> detect exact route conflicts
-> build lazy route elements
-> apply a permission guard
-> render
```

The database path is used after validation so an operator can change an internal route without rebuilding. `defaultPath` remains the idempotent seed and documentation fallback.

The route guard requires both the Page Registry's `requiredPermission` and the navigation record's permission when they differ. This prevents a database edit from weakening the source-defined minimum UI guard. API endpoint authorization remains authoritative.

Missing module/page, disabled source module, invalid path, missing icon, inactive permission, and route conflict never crash Admin. They are omitted from runtime routing/menu, logged in development, and shown as warnings in navigation management.

Legacy business routes and the dynamic host run in parallel only during transition. PHASE 11 removes the hard-coded business routes after regression confirms full coverage. Compatibility redirects remain static.

## Dynamic Sidebar

Sidebar becomes a presentational recursive tree renderer supplied by `/api/admin/navigation/me`.

It supports:

- arbitrary validated tree depth
- deterministic sort order
- group/container nodes without paths
- active state using React Router matching
- mobile close behavior
- loading skeleton
- inline error with retry
- empty state
- disabled/hidden enforcement from API
- icon lookup with fallback
- accessible nested navigation labels

The Icon Registry is a source-owned `Record<IconKey, LucideIcon>` because Lucide is already the established project dependency. Unknown keys map to a stable fallback icon and never instantiate a component name from database text.

## Seed and migration mapping

Permission migration is additive:

1. Add metadata columns with safe defaults.
2. Backfill all 19 existing rows as active system rows with deterministic sort order/timestamps.
3. Insert the two navigation descriptors only when absent.
4. Add only missing administrator grants.
5. Preserve every existing RolePermission and UserRole row.

Navigation seed inserts stable system records only when their key is absent. It never updates/deletes an operator-modified existing record during startup.

Visible seeds reproduce the complete current Sidebar. Route-only hidden seeds cover every existing create/edit/detail route. Group containers reproduce `Quản lý` and `Hệ thống`. The current visible attribute link uses the concrete category path; an additional hidden record supplies the parameterized attribute route.

No migration is applied until PHASE 9, and then only to `Lamie_Dev`. Before/after counts for the original 19 permissions, Roles, RolePermissions, Users, and UserRoles are captured in the same verification run.

## Role management improvements

The existing Roles page remains the base and gains:

- permission search
- active/system/custom indicators
- inactive permission warning
- group select-all behavior retained
- role menu preview computed from management navigation plus draft permissions
- transaction-safe save and immediate current-session/navigation refresh

An existing inactive grant is displayed but does not authorize. The system administrator cannot be disabled or lose any permission. The final administrator recovery path is therefore preserved.

## Management page behavior

Permission management includes list/search/filter, custom create, metadata update, deactivate, role usage count, protected system rows, and full loading/empty/error/retry states.

Navigation management includes a tree/flat responsive editor, create/edit, enable/disable, show/hide, parent selection, icon selection from Icon Registry, module/page selection from registries, permission selection from API, move up/down and explicit sort order, Sidebar preview, and warnings for missing page/icon/permission or permission mismatch. No drag/drop dependency is added.

Both pages use existing Admin tokens/components, keyboard-visible focus, 44-pixel actions, semantic labels, and the current low-motion dashboard language.

## Security controls

- All management endpoints require explicit policies.
- Current-user endpoints derive identity from authenticated claims and never accept a user ID parameter.
- Services validate logical references to prevent IDOR and orphan writes.
- API policies resolve active database grants server-side.
- Path, identifier, page, module, icon, and permission inputs are bounded and normalized.
- No `eval`, remote script, dynamic import path, arbitrary component string, or JavaScript URL.
- System permissions/navigation are protected from deletion.
- Permission/role/user-role/navigation mutations are audited without secrets.
- Last-administrator protections and automatic administrator grants provide recovery.
- Tree construction has cycle/depth protection and skips invalid records.
- List page size and search length are bounded.

## Performance controls

- Permission resolution is one joined query per cache miss.
- Current menu/route resolution loads permissions and navigation set-wise, never once per menu item.
- Tree construction is O(n) using ID lookups and is performed once per response/cache fill.
- EF reads use `AsNoTracking`.
- All logical reference/filter columns are indexed.
- Pages remain lazy-loaded.
- Management list queries are filtered/paged server-side where their size can grow.

## Test strategy

API tests cover permission CRUD/protection, dynamic policy behavior, inactive resolution, role/user invalidation, navigation validation/tree/filter/reorder/state, audit creation, seed idempotency, migration preservation, and zero FK constraints.

Admin uses the existing Playwright stack plus type/build verification. Tests cover manifest discovery and conflict behavior through registry-driven routes, missing page/icon fallbacks, Sidebar states/tree/permissions, dynamic route guards, permission/navigation forms, and role menu preview. No new large testing framework is added.

## Rollback plan

Before PHASE 9, rollback is source-only because migrations are not applied.

For `Lamie_Dev` migration rollback:

1. Capture row counts and a copy-only backup before applying.
2. Stop the development API.
3. Revert the latest migrations only against `Lamie_Dev` if verification fails.
4. Restore the verified backup if a down migration cannot safely reproduce the pre-state.
5. Re-run identity/login/role/permission counts and DBCC CHECKDB.

Production migration is explicitly excluded.

After deployment in a future authorized workflow, code rollback may leave additive columns/tables in place because old code ignores them. Do not drop `auth_permissions`, `auth_roles`, `auth_user_roles`, or `auth_role_permissions`. Do not remove the original 19 rows. Navigation rollback disables dynamic UI through the temporary transition flag while preserving database rows; PHASE 11 removes that flag only after integration regression passes.

## Phase implementation mapping

- PHASE 2: permission metadata, dynamic policy/resolver/cache, permission API, audit foundation, migration, tests.
- PHASE 3: navigation entity/service/endpoints/cache/audit/migration/tests.
- PHASE 4: manifest and registries.
- PHASE 5: all existing module manifests and route/menu seeds.
- PHASE 6: dynamic Sidebar.
- PHASE 7: dynamic Router.
- PHASE 8: permission/navigation management and role preview.
- PHASE 9: apply only to `Lamie_Dev`, seed and verify preservation.
- PHASE 10: complete integration regression.
- PHASE 11: remove legacy business menu/routes/catalog fallback.
- PHASE 12: final security/data/performance review and module-authoring documentation.

## PHASE 1 exit decision

The database, APIs, manifest, registries, routing, Sidebar, migration, cache, invalidation, audit, security, test, performance, and rollback contracts are fully defined with backward compatibility and no-FK preservation. PHASE 2 may implement the permission foundation.
